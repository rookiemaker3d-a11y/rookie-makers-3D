import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const INIT = {
  descripcion: '',
  horas: 0,
  minutos: 0,
  gramos: 0,
  limpieza: 0,
  diseno: 0,
  cantidad: 1,
  envio: 0,
}

export default function Calculadora() {
  const { api, user } = useAuth()
  const [form, setForm] = useState(INIT)
  const [result, setResult] = useState(null)
  const [list, setList] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const calculate = useCallback(() => {
    api('/calculator/calculate', {
      method: 'POST',
      body: JSON.stringify({
        horas: Number(form.horas) || 0,
        minutos: Number(form.minutos) || 0,
        gramos: Number(form.gramos) || 0,
        limpieza: Number(form.limpieza) || 0,
        diseno: Number(form.diseno) || 0,
        cantidad: Number(form.cantidad) || 1,
        envio: Number(form.envio) || 0,
      }),
    })
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult(null))
  }, [api, form])

  useEffect(() => {
    calculate()
  }, [form.horas, form.minutos, form.gramos, form.limpieza, form.diseno, form.cantidad, form.envio])

  const addToList = () => {
    if (!result || !form.descripcion.trim()) {
      setMsg('Completa la descripción y calcula primero.')
      return
    }
    const tiempo_total = (Number(form.horas) || 0) * 60 + (Number(form.minutos) || 0)
    const item = {
      descripcion: form.descripcion.trim(),
      cantidad: Number(form.cantidad) || 1,
      costo_base: result.costo_base_pieza,
      costo_final: result.costo_final_total,
      detalles: {
        tiempo_total,
        costo_filamento: result.costo_filamento,
        costo_energia: result.costo_energia,
        costo_limpieza: result.costo_limpieza,
        costo_diseno: result.costo_diseno,
        costo_envio: Number(form.envio) || 0,
      },
    }
    setList((prev) => [...prev, item])
    setForm((f) => ({ ...f, descripcion: '' }))
    setMsg('Pieza agregada a la lista.')
  }

  const sendQuotes = async () => {
    if (list.length === 0) {
      setMsg('Agrega al menos una pieza.')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      for (const item of list) {
        await api('/cotizaciones-en-espera', {
          method: 'POST',
          body: JSON.stringify({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            costo_base: item.costo_base,
            costo_final: item.costo_final,
            detalles: item.detalles,
          }),
        })
      }
      setList([])
      setMsg(`Se guardaron ${list.length} cotización(es) en espera.`)
    } catch (e) {
      setMsg('Error al guardar. ¿Estás logueado como vendedor?')
    } finally {
      setSaving(false)
    }
  }

  const vendedorNombre = user?.vendedor_nombre || user?.email || ''

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Calculadora de impresión 3D</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
        />
        {['horas', 'minutos', 'gramos', 'limpieza', 'diseno', 'cantidad', 'envio'].map((key) => (
          <div key={key}>
            <label className="text-slate-400 text-sm capitalize">{key}</label>
            <input
              type="number"
              step={key === 'cantidad' ? 1 : 0.01}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              onBlur={calculate}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            />
          </div>
        ))}
      </div>
      {result && (
        <p className="text-cyan-400 font-bold mb-2">Costo final total: ${result.costo_final_total.toFixed(2)}</p>
      )}
      {msg && <p className="text-slate-400 text-sm mb-2">{msg}</p>}
      <div className="flex gap-2 mb-6">
        <button onClick={addToList} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white">
          Agregar a la lista
        </button>
        <button onClick={sendQuotes} disabled={saving || list.length === 0} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar cotizaciones en espera'}
        </button>
      </div>
      {list.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="p-3 text-slate-400">Descripción</th>
                <th className="p-3 text-slate-400">Cant.</th>
                <th className="p-3 text-slate-400">Costo final</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => (
                <tr key={i} className="border-b border-slate-700">
                  <td className="p-3 text-white">{item.descripcion}</td>
                  <td className="p-3 text-white">{item.cantidad}</td>
                  <td className="p-3 text-white">${item.costo_final.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
