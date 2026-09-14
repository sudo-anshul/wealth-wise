create function public.wealthwise_save_workspace(p_expected_version bigint, p_workspace jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_version bigint; v_name text; v_limit integer; v_count integer;
  v_old_orders integer; v_new_orders integer; v_order jsonb; v_row public.wealthwise_practice_orders%rowtype;
  v_price bigint; v_cash bigint; v_quantity bigint; v_side text; v_symbol text; v_requested integer;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  -- One lock serializes all changes for this owner's bounded workspace.
  select version into v_version from public.wealthwise_workspaces where user_id=v_user for update;
  if v_version is null then raise exception 'Workspace unavailable' using errcode='42501'; end if;
  if p_expected_version is null or p_expected_version <> v_version then
    raise exception 'Workspace version conflict' using errcode='40001';
  end if;
  if jsonb_typeof(p_workspace) is distinct from 'object' or (p_workspace->>'version')::bigint is distinct from v_version+1 then
    raise exception 'Invalid workspace version' using errcode='22023';
  end if;
  foreach v_name in array array['accounts','transactions','holdings','budgets','goals','debts','watchlist','completedLessons','scenarios','practiceOrders'] loop
    if jsonb_typeof(p_workspace->v_name) is distinct from 'array' then raise exception 'Missing workspace collection' using errcode='22023'; end if;
    v_count := jsonb_array_length(p_workspace->v_name);
    v_limit := case v_name when 'transactions' then 10000 when 'holdings' then 500 when 'budgets' then 1000 when 'practiceOrders' then 2000 else 100 end;
    if v_count > v_limit then raise exception 'Workspace collection limit exceeded' using errcode='22023'; end if;
  end loop;
  if jsonb_typeof(p_workspace->'preferences') is distinct from 'object' then raise exception 'Preferences required' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_workspace->'holdings') x where (x->>'quantity')::numeric*1000000 <> trunc((x->>'quantity')::numeric*1000000)) then
    raise exception 'Holding quantity exceeds supported precision' using errcode='22023';
  end if;
  -- Transfers must remain paired, balanced and scoped to two owned accounts.
  if exists(
    select 1 from jsonb_array_elements(p_workspace->'transactions') x where x->>'transferId' is not null
    group by (x->>'transferId')::uuid
    having count(*) <> 2 or count(distinct (x->>'accountId')::uuid) <> 2
      or sum((x->>'amountMinor')::numeric) <> 0 or min((x->>'amountMinor')::numeric) >= 0
      or count(distinct x->>'date') <> 1
  ) then raise exception 'Transfer entries must balance' using errcode='22023'; end if;

  -- The browser cannot rewrite fills or invent a fill price by calling this RPC.
  select count(*) into v_old_orders from public.wealthwise_practice_orders where user_id=v_user;
  v_new_orders := jsonb_array_length(p_workspace->'practiceOrders');
  if v_new_orders < v_old_orders or v_new_orders > v_old_orders+1 then
    raise exception 'Practice history is append-only, one order per command' using errcode='22023';
  end if;
  for v_row in select * from public.wealthwise_practice_orders where user_id=v_user order by position loop
    v_order := p_workspace->'practiceOrders'->v_row.position;
    if (v_order->>'id')::uuid is distinct from v_row.id
      or v_order->>'symbol' is distinct from v_row.symbol
      or v_order->>'side' is distinct from v_row.side
      or (v_order->>'quantity')::integer is distinct from v_row.quantity
      or (v_order->>'priceMinor')::bigint is distinct from v_row.price_minor
      or (v_order->>'filledAt')::timestamptz is distinct from v_row.filled_at then
      raise exception 'Saved practice fills cannot be changed' using errcode='22023';
    end if;
  end loop;
  if v_new_orders = v_old_orders+1 then
    v_order := p_workspace->'practiceOrders'->v_old_orders;
    v_symbol := v_order->>'symbol'; v_side := v_order->>'side'; v_requested := (v_order->>'quantity')::integer;
    select price_minor into v_price from public.wealthwise_practice_instruments where symbol=v_symbol;
    if v_price is null or (v_order->>'priceMinor')::bigint is distinct from v_price or v_side not in ('buy','sell') or v_requested not between 1 and 100000 then
      raise exception 'Invalid practice order or price' using errcode='22023';
    end if;
    select 100000000+coalesce(sum(case side when 'buy' then -quantity::bigint*price_minor else quantity::bigint*price_minor end),0)
      into v_cash from public.wealthwise_practice_orders where user_id=v_user;
    select coalesce(sum(case side when 'buy' then quantity else -quantity end),0)
      into v_quantity from public.wealthwise_practice_orders where user_id=v_user and symbol=v_symbol;
    if (v_side='buy' and v_cash < v_requested::bigint*v_price) or (v_side='sell' and v_quantity < v_requested) then
      raise exception 'Insufficient practice balance or position' using errcode='22023';
    end if;
    insert into public.wealthwise_practice_orders(user_id,id,position,symbol,side,quantity,price_minor,filled_at)
      values(v_user,(v_order->>'id')::uuid,v_old_orders,v_symbol,v_side,v_requested,v_price,date_trunc('milliseconds',clock_timestamp()));
  end if;

  -- Replace normalized manual records atomically. FKs and constraints reject inconsistent snapshots.
  delete from public.wealthwise_transactions where user_id=v_user;
  delete from public.wealthwise_accounts where user_id=v_user;
  delete from public.wealthwise_holdings where user_id=v_user;
  delete from public.wealthwise_budgets where user_id=v_user;
  delete from public.wealthwise_goals where user_id=v_user;
  delete from public.wealthwise_debts where user_id=v_user;
  delete from public.wealthwise_watchlist where user_id=v_user;
  delete from public.wealthwise_completed_lessons where user_id=v_user;
  delete from public.wealthwise_scenarios where user_id=v_user;

  insert into public.wealthwise_accounts(user_id,id,position,name,type,opening_balance_minor)
    select v_user,(x->>'id')::uuid,n-1,x->>'name',x->>'type',(x->>'openingBalanceMinor')::bigint
    from jsonb_array_elements(p_workspace->'accounts') with ordinality a(x,n);
  insert into public.wealthwise_transactions(user_id,id,position,account_id,effective_on,description,category,amount_minor,transfer_id)
    select v_user,(x->>'id')::uuid,n-1,(x->>'accountId')::uuid,(x->>'date')::date,x->>'description',x->>'category',(x->>'amountMinor')::bigint,(x->>'transferId')::uuid
    from jsonb_array_elements(p_workspace->'transactions') with ordinality a(x,n);
  insert into public.wealthwise_holdings(user_id,id,position,name,symbol,asset_class,quantity,average_cost_minor,price_minor,as_of)
    select v_user,(x->>'id')::uuid,n-1,x->>'name',x->>'symbol',x->>'assetClass',(x->>'quantity')::numeric,(x->>'averageCostMinor')::bigint,(x->>'priceMinor')::bigint,(x->>'asOf')::date
    from jsonb_array_elements(p_workspace->'holdings') with ordinality a(x,n);
  insert into public.wealthwise_budgets(user_id,id,position,category,month,limit_minor)
    select v_user,(x->>'id')::uuid,n-1,x->>'category',x->>'month',(x->>'limitMinor')::bigint
    from jsonb_array_elements(p_workspace->'budgets') with ordinality a(x,n);
  insert into public.wealthwise_goals(user_id,id,position,name,target_minor,saved_minor,monthly_minor,target_date,color)
    select v_user,(x->>'id')::uuid,n-1,x->>'name',(x->>'targetMinor')::bigint,(x->>'savedMinor')::bigint,(x->>'monthlyMinor')::bigint,(x->>'targetDate')::date,x->>'color'
    from jsonb_array_elements(p_workspace->'goals') with ordinality a(x,n);
  insert into public.wealthwise_debts(user_id,id,position,name,balance_minor,annual_rate,remaining_months)
    select v_user,(x->>'id')::uuid,n-1,x->>'name',(x->>'balanceMinor')::bigint,(x->>'annualRate')::numeric,(x->>'remainingMonths')::integer
    from jsonb_array_elements(p_workspace->'debts') with ordinality a(x,n);
  insert into public.wealthwise_watchlist(user_id,symbol,position)
    select v_user,x#>>'{}',n-1 from jsonb_array_elements(p_workspace->'watchlist') with ordinality a(x,n);
  insert into public.wealthwise_completed_lessons(user_id,lesson_id,position)
    select v_user,x#>>'{}',n-1 from jsonb_array_elements(p_workspace->'completedLessons') with ordinality a(x,n);
  insert into public.wealthwise_scenarios(user_id,id,position,name,kind,principal_minor,monthly_minor,years,annual_rate)
    select v_user,(x->>'id')::uuid,n-1,x->>'name',x->>'kind',(x->>'principalMinor')::bigint,(x->>'monthlyMinor')::bigint,(x->>'years')::integer,(x->>'annualRate')::numeric
    from jsonb_array_elements(p_workspace->'scenarios') with ordinality a(x,n);
  update public.wealthwise_workspaces set version=v_version+1,
    display_name=p_workspace->'preferences'->>'name', currency=p_workspace->'preferences'->>'currency',
    hide_balances=(p_workspace->'preferences'->>'hideBalances')::boolean,
    monthly_review=(p_workspace->'preferences'->>'monthlyReview')::boolean, updated_at=clock_timestamp()
    where user_id=v_user;
  return public.wealthwise_read_workspace(v_user);
end $$;
revoke all on function public.wealthwise_save_workspace(bigint,jsonb) from public,anon;
grant execute on function public.wealthwise_save_workspace(bigint,jsonb) to authenticated;
