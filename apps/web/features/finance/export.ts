export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download explicit, user-requested CSV exports. Escape formula prefixes for spreadsheet safety. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = typeof value === 'string' && /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  downloadText(filename, csv);
}
