import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('parkscan_admin');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex text-dark-text font-serif relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Admin */}
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
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">ADMINISTRATION</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <Home className="w-5 h-5 text-dark-muted group-hover:text-accent transition-colors" />
            <span className="font-semibold">Dashboard</span>
          </Link>
          <Link 
            to="/admin/sectores" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <LayoutGrid className="w-5 h-5 text-dark-muted group-hover:text-accent transition-colors" />
            <span className="font-semibold">Sectores y Plazas</span>
          </Link>
          <Link 
            to="/admin/operarios" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <Home className="w-5 h-5 text-dark-muted group-hover:text-brand transition-colors" />
            <span className="font-semibold">Operarios y Turnos</span>
          </Link>
        </nav>

        <div className="p-6 mt-auto border-t border-dark-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500/80 hover:bg-red-500/5 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-dark-bg flex flex-col w-full h-screen">
        <header className="bg-dark-card/50 backdrop-blur-md border-b border-dark-border px-6 md:px-10 py-5 flex items-center sticky top-0 z-10 gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="text-sm md:text-lg font-bold text-white uppercase tracking-widest flex-1">Panel de Control Central</h1>
          
          <div className="flex items-center gap-4 ml-auto">
             <div className="w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_#7c3aed]"></div>
             <span className="text-[10px] font-bold text-dark-muted uppercase tracking-widest">Sistema En Línea</span>
          </div>
        </header>
        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
