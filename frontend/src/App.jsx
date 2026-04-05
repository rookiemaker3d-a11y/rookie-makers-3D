import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminOnlyRoute from './components/AdminOnlyRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calculadora from './pages/Calculadora'
import Productos from './pages/Productos'
import CotizacionesEspera from './pages/CotizacionesEspera'
import NuevaCotizacion from './pages/NuevaCotizacion'
import Analisis from './pages/Analisis'
import Clientes from './pages/Clientes'
import Vendedores from './pages/Vendedores'
import Cotizador from './pages/Cotizador'
import VideosPromocionales from './pages/VideosPromocionales'
import Inventario from './pages/Inventario'
import Seguridad from './pages/Seguridad'
import Configuracion from './pages/Configuracion'
import EditorPaginaPublica from './pages/EditorPaginaPublica'
import Chatbot from './components/Chatbot'
import './index.css'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cotizador" element={<Cotizador />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="cotizacion/nueva" element={<NuevaCotizacion />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="productos" element={<Productos />} />
        <Route path="cotizaciones-espera" element={<CotizacionesEspera />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="vendedores" element={<AdminOnlyRoute><Vendedores /></AdminOnlyRoute>} />
        <Route path="videos-promocionales" element={<VideosPromocionales />} />
        <Route path="pagina-publica" element={<AdminOnlyRoute><EditorPaginaPublica /></AdminOnlyRoute>} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="seguridad" element={<Seguridad />} />
        <Route path="analisis" element={<Analisis />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
          <Chatbot />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
