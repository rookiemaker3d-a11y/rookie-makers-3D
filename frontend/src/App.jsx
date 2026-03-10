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
import Proyectos from './pages/Proyectos'
import Cotizador from './pages/Cotizador'
import VideosPromocionales from './pages/VideosPromocionales'
import Chatbot from './components/Chatbot'
import './index.css'

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/proyectos" element={<Proyectos />} />
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
        <Route path="analisis" element={<Analisis />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
          <Chatbot />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
