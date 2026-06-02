import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Monitor, CreditCard, Clock, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function OperarioLayout() {
  const navigate = useNavigate();
  const [operador, setOperador] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('parkscan_operario');
    if (session) {
      const op = JSON.parse(session);
      setOperador(op);

      const checkStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('operarios')
            .select('estado')
            .eq('id_operario', op.id_operario)
            .single();

          const user = Array.isArray(data) ? data[0] : data;
          if (error || !user || user.estado !== 'activo') {
            localStorage.removeItem('parkscan_operario');
            alert('Su sesión ha expirado o su usuario se encuentra inactivo.');
            navigate('/operario/login');
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
      };
      checkStatus();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('parkscan_operario');
    navigate('/operario/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex text-dark-text relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Operario */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-dark-card border-r border-dark-border flex flex-col shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button Mobile */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-dark-muted hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
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
          <Link 
            to="/operario/ingreso" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <Clock className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
            <span className="font-semibold">Ingreso Manual</span>
          </Link>
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
      <main className="flex-1 overflow-auto bg-dark-bg flex flex-col h-screen">
        <header className="bg-dark-card/50 backdrop-blur-md border-b border-dark-border px-6 py-4 flex items-center lg:hidden sticky top-0 z-10">
           <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-white uppercase tracking-widest ml-4">Panel Operario</h1>
        </header>
        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
