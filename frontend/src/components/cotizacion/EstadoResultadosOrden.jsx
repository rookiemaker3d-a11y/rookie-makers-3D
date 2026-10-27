const FILAS = [
  ['Material (PLA + merma)', 'material'],
  ['Luz', 'luz'],
  ['Internet', 'internet'],
  ['Desgaste de máquina', 'desgaste'],
  ['Mano de obra', 'mano_obra'],
]

function money(n) {
  return `$${(Number(n) || 0).toFixed(2)}`
}

export default function EstadoResultadosOrden({ estado, titulo = 'Estado de resultados' }) {
  if (!estado) return null
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs space-y-1">
      <p className="theme-text font-semibold text-sm mb-1">{titulo}</p>
      {FILAS.map(([label, key]) => (
        <div key={key} className="flex justify-between theme-text-muted">
          <span>{label}</span>
          <span className="tabular-nums theme-text">{money(estado[key])}</span>
        </div>
      ))}
      <div className="flex justify-between theme-text font-medium pt-1 border-t border-white/10">
        <span>Costo real</span>
        <span className="tabular-nums">{money(estado.costo_real)}</span>
      </div>
      <div className="flex justify-between theme-text-muted">
        <span>Precio cobrado</span>
        <span className="tabular-nums theme-text">{money(estado.precio)}</span>
      </div>
      <div className={`flex justify-between font-semibold ${(estado.ganancia || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        <span>Ganancia</span>
        <span className="tabular-nums">
          {money(estado.ganancia)}
          {estado.precio > 0 ? ` · ${((estado.margen || 0) * 100).toFixed(0)}%` : ''}
        </span>
      </div>
    </div>
  )
}
