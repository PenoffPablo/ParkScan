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
    <div className="min-h-screen bg-dark-bg flex text-dark-text">
      {/* Sidebar Operario */}
      <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col shadow-2xl z-10">
        <div className="p-8">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1">ParkScan</h2>
          <p className="text-xs font-bold text-brand uppercase tracking-widest">Panel Operario</p>
          {operador && (
            <div className="mt-8 p-4 bg-dark-bg border border-dark-border rounded-xl">
              <p className="font-bold text-white text-sm">{operador.nombre} {operador.apellido}</p>
              <div className="flex items-center gap-2 mt-2 text-green-400 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Turno Activo
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link 
            to="/operario/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <Monitor className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
            <span className="font-semibold">Control de Plazas</span>
          </Link>
          <button 
            className="flex items-center w-full gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
            onClick={() => alert("Pendiente de implementar: Ingreso de Vehículo")}
          >
            <Clock className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
            <span className="font-semibold">Ingreso Manual</span>
          </button>
          <Link 
            to="/operario/cobro" 
            className="flex items-center w-full gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
          >
            <CreditCard className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
            <span className="font-semibold">Centro de Cobros</span>
          </Link>
        </nav>

        <div className="p-6 mt-auto border-t border-dark-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500/80 hover:bg-red-500/5 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold">Finalizar Turno</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-dark-bg flex flex-col">
        <div className="p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
