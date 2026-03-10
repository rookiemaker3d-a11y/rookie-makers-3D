import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Vendedores() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/vendedores')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }, [api])

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Vendedores</h1>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="p-3 text-slate-400">ID</th>
              <th className="p-3 text-slate-400">Nombre</th>
              <th className="p-3 text-slate-400">Correo</th>
              <th className="p-3 text-slate-400">Teléfono</th>
              <th className="p-3 text-slate-400">Banco / Cuenta</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b border-slate-700">
                <td className="p-3 text-white">{v.id}</td>
                <td className="p-3 text-white">{v.nombre}</td>
                <td className="p-3 text-white">{v.correo}</td>
                <td className="p-3 text-slate-400">{v.telefono}</td>
                <td className="p-3 text-slate-400">{v.banco} - {v.cuenta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
