import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { User, Search, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Card, SectionHeader } from '../ui'

const TIPOS_CLIENTE = [
  { id: 'particular', label: 'Particular' },
  { id: 'universitario', label: 'Universitario' },
  { id: 'empresa', label: 'Empresa' },
]

export default function PasoCliente({ data, onChange, onValid }) {
  const { api } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [crearNuevo, setCrearNuevo] = useState(false)
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    tipo: 'particular',
  })

  useEffect(() => {
    api('/clientes')
      .then((r) => r.json())
      .then(setClientes)
      .catch(() => setClientes([]))
      .finally(() => setLoading(false))
  }, [api])

  const filtrados = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 8)
    const q = search.toLowerCase().trim()
    return clientes.filter(
      (c) =>
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.correo && c.correo.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.includes(q))
    ).slice(0, 8)
  }, [clientes, search])

  const seleccionarCliente = (c) => {
    onChange({ cliente: { id: c.id, nombre: c.nombre, correo: c.correo, telefono: c.telefono, direccion: c.direccion } })
    setCrearNuevo(false)
    onValid?.(true)
  }

  const guardarNuevo = async (e) => {
    e.preventDefault()
    if (!nuevoForm.nombre.trim() || !nuevoForm.correo.trim()) return
    try {
      const res = await api('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nuevoForm.nombre.trim(),
          correo: nuevoForm.correo.trim(),
          telefono: nuevoForm.telefono.trim() || undefined,
          direccion: nuevoForm.direccion.trim() || undefined,
        }),
      })
      const c = await res.json()
      seleccionarCliente(c)
    } catch {
      onValid?.(false)
    }
  }

  const clienteActual = data?.cliente

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader
        title="Datos del cliente"
        subtitle="Busca un cliente existente o registra uno nuevo"
      />

      {clienteActual && !crearNuevo ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold theme-text">{clienteActual.nombre}</p>
              <p className="theme-text-muted text-sm">{clienteActual.correo}</p>
              {clienteActual.telefono && (
                <p className="theme-text-muted text-sm">{clienteActual.telefono}</p>
              )}
              <p className="theme-text-dim text-xs mt-2">Historial y monto acumulado (próximamente)</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ cliente: null })}
              className="theme-text-muted hover:theme-text text-sm"
            >
              Cambiar
            </button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <label className="block text-sm font-medium theme-text-muted mb-2">Buscar cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-dim" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, correo o teléfono..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim focus:ring-2 focus:ring-[rgba(79,142,247,0.5)]"
              />
            </div>
            {loading ? (
              <p className="theme-text-dim text-sm mt-2">Cargando clientes...</p>
            ) : (
              <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {filtrados.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => seleccionarCliente(c)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] theme-text text-sm flex justify-between items-center"
                    >
                      <span>{c.nombre}</span>
                      <span className="theme-text-dim text-xs">{c.correo}</span>
                    </button>
                  </li>
                ))}
                {filtrados.length === 0 && search && (
                  <li className="theme-text-dim text-sm px-3 py-2">Sin resultados</li>
                )}
              </ul>
            )}
          </Card>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="theme-text-dim text-xs">o</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {!crearNuevo ? (
            <button
              type="button"
              onClick={() => setCrearNuevo(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] theme-text text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo cliente
            </button>
          ) : (
            <Card>
              <h3 className="text-sm font-semibold theme-text mb-3">Registrar nuevo cliente</h3>
              <form onSubmit={guardarNuevo} className="space-y-3">
                <input
                  placeholder="Nombre *"
                  value={nuevoForm.nombre}
                  onChange={(e) => setNuevoForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim"
                  required
                />
                <input
                  type="email"
                  placeholder="Correo *"
                  value={nuevoForm.correo}
                  onChange={(e) => setNuevoForm((f) => ({ ...f, correo: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim"
                  required
                />
                <input
                  placeholder="Teléfono"
                  value={nuevoForm.telefono}
                  onChange={(e) => setNuevoForm((f) => ({ ...f, telefono: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim"
                />
                <select
                  value={nuevoForm.tipo}
                  onChange={(e) => setNuevoForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text"
                >
                  {TIPOS_CLIENTE.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <input
                  placeholder="Dirección"
                  value={nuevoForm.direccion}
                  onChange={(e) => setNuevoForm((f) => ({ ...f, direccion: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] theme-text placeholder-theme-dim"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-white/[0.1] hover:bg-white/[0.14] theme-text font-medium"
                  >
                    Guardar y usar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrearNuevo(false)}
                    className="px-4 py-2 rounded-lg bg-white/[0.06] theme-text-muted hover:theme-text"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )
}
