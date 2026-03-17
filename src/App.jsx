import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSectores from './pages/admin/Sectores';
import AdminOperarios from './pages/admin/Operarios';
import AdminLayout from './components/AdminLayout';
import OperarioLogin from './pages/operario/Login';
import OperarioDashboard from './pages/operario/Dashboard';
import OperarioCobro from './pages/operario/Cobro';
import OperarioLayout from './components/OperarioLayout';
import ClienteHome from './pages/cliente/Home';
import ClientePago from './pages/cliente/Pago';
import './App.css';

// Componentes para proteger rutas
const AdminRoute = ({ children }) => {
  const session = localStorage.getItem('parkscan_admin');
  return session ? children : <Navigate to="/admin/login" />;
};

const OperarioRoute = ({ children }) => {
  const session = localStorage.getItem('parkscan_operario');
  return session ? children : <Navigate to="/operario/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas (Cliente) */}
        <Route path="/" element={<ClienteHome />} />
        <Route path="/pago" element={<ClientePago />} />

        {/* Rutas Administrador */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } 
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="sectores" element={<AdminSectores />} />
          <Route path="operarios" element={<AdminOperarios />} />
        </Route>

        {/* Rutas Operario */}
        <Route path="/operario/login" element={<OperarioLogin />} />
        <Route 
          path="/operario" 
          element={
            <OperarioRoute>
              <OperarioLayout />
            </OperarioRoute>
          } 
        >
          <Route path="dashboard" element={<OperarioDashboard />} />
          <Route path="cobro" element={<OperarioCobro />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
