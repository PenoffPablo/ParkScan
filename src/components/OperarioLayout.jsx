import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Monitor, CreditCard, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OperarioLayout() {
  const navigate = useNavigate();
  const [operador, setOperador] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('parkscan_operario');
    if (session) {
      setOperador(JSON.parse(session));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('parkscan_operario');
    navigate('/operario/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Operario */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-accent">ParkScan</h2>
          <p className="text-sm text-indigo-200">Panel Operario</p>
          {operador && (
            <div className="mt-4 p-3 bg-indigo-800 rounded-lg">
              <p className="font-medium text-sm">Operador: {operador.nombre}</p>
              <div className="flex items-center gap-1 mt-1 text-green-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Turno Activo
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link 
            to="/operario/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-colors"
          >
            <Monitor className="w-5 h-5" />
            Control de Plazas
          </Link>
          <button 
            className="flex items-center w-full gap-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-colors text-left"
            onClick={() => alert("Pendiente de implementar: Ingreso de Vehículo")}
          >
            <Clock className="w-5 h-5" />
            Ingreso Manual
          </button>
          <Link 
            to="/operario/cobro" 
            className="flex items-center w-full gap-3 px-4 py-3 rounded-lg hover:bg-indigo-800 transition-colors text-left"
          >
            <CreditCard className="w-5 h-5" />
            Cobro / Salida
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión / Turno
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
