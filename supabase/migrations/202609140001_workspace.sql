-- Owner-scoped, normalized manual finance. Apply through Supabase migrations.
-- All user writes enter an atomic RPC; clients can only SELECT their own rows.
create table public.wealthwise_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 0 check (version between 0 and 9007199254740991),
  display_name text not null default 'Your workspace' check (char_length(display_name) between 1 and 80),
  currency text not null default 'INR' check (currency = 'INR'),
  hide_balances boolean not null default false,
  monthly_review boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.wealthwise_accounts (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0),
  name text not null check (char_length(name) between 1 and 120),
  type text not null check (type in ('cash','savings','retirement')),
  opening_balance_minor bigint not null check (opening_balance_minor between 0 and 100000000000000),
  primary key (user_id,id)
);
create table public.wealthwise_transactions (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0), account_id uuid not null,
  effective_on date not null, description text not null check (char_length(description) between 1 and 120),
  category text not null check (category in ('Salary','Other income','Housing','Food','Transport','Shopping','Health','Learning','Entertainment','Utilities','Other','Transfer')),
  amount_minor bigint not null check (amount_minor between -100000000000 and 100000000000 and amount_minor <> 0),
  transfer_id uuid,
  primary key (user_id,id),
  foreign key (user_id,account_id) references public.wealthwise_accounts(user_id,id),
  check ((category = 'Transfer') = (transfer_id is not null))
);
create index wealthwise_transactions_date on public.wealthwise_transactions(user_id,effective_on desc);
create index wealthwise_transactions_account on public.wealthwise_transactions(user_id,account_id);
create table public.wealthwise_holdings (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0),
  name text not null check (char_length(name) between 1 and 120), symbol text not null check (char_length(symbol) between 1 and 24),
  asset_class text not null check (asset_class in ('Equity','Mutual fund','ETF','Gold','Other')),
  quantity numeric(20,6) not null check (quantity > 0 and quantity <= 1000000),
  average_cost_minor bigint not null check (average_cost_minor between 0 and 100000000000000),
  price_minor bigint not null check (price_minor between 0 and 100000000000000), as_of date not null,
  primary key (user_id,id)
);
create table public.wealthwise_budgets (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0),
  category text not null check (category in ('Salary','Other income','Housing','Food','Transport','Shopping','Health','Learning','Entertainment','Utilities','Other','Transfer')),
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  limit_minor bigint not null check (limit_minor > 0 and limit_minor <= 100000000000000),
  primary key (user_id,id), unique (user_id,category,month)
);
create table public.wealthwise_goals (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0), name text not null check (char_length(name) between 1 and 120),
  target_minor bigint not null check (target_minor > 0 and target_minor <= 100000000000000),
  saved_minor bigint not null check (saved_minor >= 0 and saved_minor <= target_minor),
  monthly_minor bigint not null check (monthly_minor between 0 and 100000000000000),
  target_date date not null, color text not null check (color in ('forest','coral','lime')), primary key (user_id,id)
);
create table public.wealthwise_debts (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0), name text not null check (char_length(name) between 1 and 120),
  balance_minor bigint not null check (balance_minor between 0 and 100000000000000),
  annual_rate numeric(12,8) not null check (annual_rate between 0 and 60),
  remaining_months integer not null check (remaining_months between 1 and 600), primary key (user_id,id)
);
create table public.wealthwise_practice_instruments (
  symbol text primary key, price_minor bigint not null check (price_minor > 0),
  dataset_version text not null default 'fictional-v1'
);
insert into public.wealthwise_practice_instruments(symbol,price_minor) values
  ('NOVA',125000),('CEDAR',242500),('TERRA',84000),('MEADOW',24800),('HARBOR',16240),('AURUM',6450);
create table public.wealthwise_watchlist (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  symbol text not null references public.wealthwise_practice_instruments(symbol), position integer not null check (position >= 0), primary key (user_id,symbol)
);
create table public.wealthwise_completed_lessons (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 80), position integer not null check (position >= 0), primary key (user_id,lesson_id)
);
create table public.wealthwise_scenarios (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0), name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('sip','emi','goal')),
  principal_minor bigint not null check (principal_minor between 0 and 100000000000000),
  monthly_minor bigint not null check (monthly_minor between 0 and 100000000000000),
  years integer not null check (years between 1 and 50), annual_rate numeric(12,8) not null check (annual_rate between 0 and 60), primary key (user_id,id)
);
create table public.wealthwise_practice_orders (
  user_id uuid not null references public.wealthwise_workspaces on delete cascade,
  id uuid not null, position integer not null check (position >= 0),
  symbol text not null references public.wealthwise_practice_instruments(symbol), side text not null check (side in ('buy','sell')),
  quantity integer not null check (quantity between 1 and 100000), price_minor bigint not null check (price_minor > 0),
  filled_at timestamptz not null default clock_timestamp(), primary key (user_id,id), unique (user_id,position)
);

do $$
declare t text;
begin
  foreach t in array array['wealthwise_workspaces','wealthwise_accounts','wealthwise_transactions','wealthwise_holdings','wealthwise_budgets','wealthwise_goals','wealthwise_debts','wealthwise_watchlist','wealthwise_completed_lessons','wealthwise_scenarios','wealthwise_practice_orders'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy owner_read on public.%I for select to authenticated using (user_id = (select auth.uid()))',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
alter table public.wealthwise_practice_instruments enable row level security;
create policy catalog_read on public.wealthwise_practice_instruments for select to authenticated using (true);
revoke all on public.wealthwise_practice_instruments from anon,authenticated;
grant select on public.wealthwise_practice_instruments to authenticated;

-- Internal serializer; deliberately not callable by API users with arbitrary user IDs.
create function public.wealthwise_read_workspace(p_user uuid) returns jsonb
language sql security definer set search_path = '' as $$
select jsonb_build_object(
  'version', w.version,
  'preferences',jsonb_build_object('name',w.display_name,'currency',w.currency,'hideBalances',w.hide_balances,'monthlyReview',w.monthly_review),
  'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'type',type,'openingBalanceMinor',opening_balance_minor) order by position) from public.wealthwise_accounts where user_id=p_user),'[]'),
  'transactions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'accountId',account_id,'date',effective_on,'description',description,'category',category,'amountMinor',amount_minor,'transferId',transfer_id)) order by position) from public.wealthwise_transactions where user_id=p_user),'[]'),
  'holdings',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'symbol',symbol,'assetClass',asset_class,'quantity',quantity,'averageCostMinor',average_cost_minor,'priceMinor',price_minor,'asOf',as_of) order by position) from public.wealthwise_holdings where user_id=p_user),'[]'),
  'budgets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'category',category,'month',month,'limitMinor',limit_minor) order by position) from public.wealthwise_budgets where user_id=p_user),'[]'),
  'goals',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'targetMinor',target_minor,'savedMinor',saved_minor,'monthlyMinor',monthly_minor,'targetDate',target_date,'color',color) order by position) from public.wealthwise_goals where user_id=p_user),'[]'),
  'debts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'balanceMinor',balance_minor,'annualRate',annual_rate,'remainingMonths',remaining_months) order by position) from public.wealthwise_debts where user_id=p_user),'[]'),
  'watchlist',coalesce((select jsonb_agg(symbol order by position) from public.wealthwise_watchlist where user_id=p_user),'[]'),
  'completedLessons',coalesce((select jsonb_agg(lesson_id order by position) from public.wealthwise_completed_lessons where user_id=p_user),'[]'),
  'scenarios',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'kind',kind,'principalMinor',principal_minor,'monthlyMinor',monthly_minor,'years',years,'annualRate',annual_rate) order by position) from public.wealthwise_scenarios where user_id=p_user),'[]'),
  'practiceOrders',coalesce((select jsonb_agg(jsonb_build_object('id',id,'symbol',symbol,'side',side,'quantity',quantity,'priceMinor',price_minor,'filledAt',to_char(filled_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) order by position) from public.wealthwise_practice_orders where user_id=p_user),'[]')
) from public.wealthwise_workspaces w where w.user_id=p_user
$$;
revoke all on function public.wealthwise_read_workspace(uuid) from public,anon,authenticated;

create function public.wealthwise_get_workspace() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_name text := nullif(trim(auth.jwt()->'user_metadata'->>'display_name'),'');
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  insert into public.wealthwise_workspaces(user_id,display_name) values(v_user,coalesce(left(v_name,80),'Your workspace')) on conflict(user_id) do nothing;
  return public.wealthwise_read_workspace(v_user);
end $$;
revoke all on function public.wealthwise_get_workspace() from public,anon;
grant execute on function public.wealthwise_get_workspace() to authenticated;
