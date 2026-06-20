export default function DataTable({ columns, rows, onRow, empty = 'Nothing here yet.' }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-line bg-paper-0">
          <tr>{columns.map((c) => <th key={c.key} className={`th ${c.right ? 'text-right' : ''}`}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="td text-center text-ink-400 py-12">{empty}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id ?? i}
              onClick={() => onRow?.(row)}
              className={`border-b border-line/60 last:border-0 ${onRow ? 'cursor-pointer hover:bg-rose-100/60' : ''} ${i % 2 ? 'bg-paper-50/40' : ''}`}>
              {columns.map((c) => (
                <td key={c.key} className={`td ${c.right ? 'text-right' : ''} ${c.mono ? 'mono' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
