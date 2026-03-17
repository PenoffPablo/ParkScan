import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Car, CreditCard, Ticket } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ocupacion: 0,
    recaudacion: 0,
    ticketsHoy: 0
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl">
          <Ticket className="w-8 h-8 text-accent" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight appearance-none mb-1">Métricas de Operación</h2>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Resumen de actividad en tiempo real</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="dark-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Car className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] mb-4">Eficiencia de Ocupación</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black text-white leading-none">{stats.ocupacion}%</span>
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse mb-2"></div>
            </div>
            <div className="mt-6 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
               <div className="bg-brand h-full transition-all duration-1000" style={{width: `${stats.ocupacion}%`}}></div>
            </div>
          </div>
        </div>

        <div className="dark-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <CreditCard className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] mb-4">Ingresos Brutos (Hoy)</p>
            <div className="flex items-end gap-1">
              <span className="text-dark-muted text-2xl font-bold mb-1">$</span>
              <span className="text-6xl font-black text-white leading-none">{stats.recaudacion}</span>
            </div>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-6">+12.5% respecto ayer</p>
          </div>
        </div>

        <div className="dark-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] mb-4">Flujo de Clientes</p>
            <div className="flex items-end gap-4">
              <span className="text-6xl font-black text-white leading-none">{stats.ticketsHoy}</span>
              <span className="text-xs font-bold text-dark-muted mb-2 tracking-widest italic">TICKETS</span>
            </div>
            <div className="mt-6 flex gap-1">
               {[1,2,3,4,5,6,7].map(i => (
                 <div key={i} className="flex-1 bg-white/5 hover:bg-white/20 h-8 rounded-sm transition-colors cursor-help" style={{height: `${Math.random()*100}%`}}></div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
