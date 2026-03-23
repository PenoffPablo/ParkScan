import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Monitor, Pause, Play } from 'lucide-react';

export default function OperarioDashboard() {
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisponibilidad();
    
    // Suscripción a cambios en tiempo real (Supabase Realtime) para las plazas
    const plazasSubscription = supabase
      .channel('cambios-plazas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plazas' }, payload => {
        fetchDisponibilidad();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plazasSubscription);
    };
  }, []);

  const fetchDisponibilidad = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sectores')
        .select(`
          *,
          plazas (*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSectores(data || []);
    } catch (error) {
      console.error('Error fetching disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSectorState = async (sector) => {
    if (!window.confirm(`¿Deseas cambiar el estado del sector ${sector.nombre}?`)) return;
    try {
      const nuevoEstado = sector.estado === 'disponible' ? 'mantenimiento' : 'disponible';
      const { error } = await supabase
        .from('sectores')
        .update({ estado: nuevoEstado })
        .eq('id_sector', sector.id_sector);

      if (error) throw error;
      fetchDisponibilidad();
    } catch (error) {
      console.error('Error al cambiar el estado del sector:', error);
      alert('Error al cambiar el estado del sector.');
    }
  };

  const togglePlazaState = async (plaza) => {
    if (plaza.estado === 'ocupada') {
      alert('La plaza actualmente está ocupada, no se puede cambiar a mantenimiento.');
      return;
    }
    if (!window.confirm(`¿Deseas ${plaza.estado === 'libre' ? 'deshabilitar' : 'habilitar'} la plaza ${plaza.numero}?`)) return;
    try {
      const nuevoEstado = plaza.estado === 'libre' ? 'mantenimiento' : 'libre';
      const { error } = await supabase
        .from('plazas')
        .update({ estado: nuevoEstado })
        .eq('id_plaza', plaza.id_plaza);

      if (error) throw error;
      fetchDisponibilidad();
    } catch (error) {
      console.error('Error al cambiar el estado de la plaza:', error);
      alert('Error al cambiar el estado de la plaza.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      <p className="text-dark-muted font-bold text-sm uppercase tracking-widest">Sincronizando Plazas...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
          <Monitor className="w-8 h-8 text-brand" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Monitoreo en Tiempo Real</h2>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Estado de ocupación por sectores</p>
        </div>
      </div>

      <div className="grid gap-8">
        {sectores.map((sector) => {
          const plazasLibres = sector.plazas?.filter(p => p.estado === 'libre').length || 0;
          const totalPlazas = sector.plazas?.length || 0;

          return (
            <div key={sector.id_sector} className="dark-card overflow-hidden group hover:border-brand/30">
              <div className="p-6 border-b border-dark-border bg-white/[0.02] flex justify-between items-center group-hover:bg-brand/5 transition-colors duration-500">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                      {sector.nombre}
                      {sector.estado === 'mantenimiento' && (
                        <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20 uppercase tracking-widest">En Mantenimiento</span>
                      )}
                    </h3>
                    <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest">Capacidad Instalada</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSectorState(sector); }}
                    className={`p-2 rounded-lg border ${sector.estado === 'disponible' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/10' : 'border-green-500/20 text-green-500 hover:bg-green-500/10'}`}
                    title={sector.estado === 'disponible' ? 'Deshabilitar Sector' : 'Habilitar Sector'}
                  >
                    {sector.estado === 'disponible' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${plazasLibres > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {plazasLibres} / {totalPlazas}
                  </div>
                  <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest">Plazas Libres</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                  {sector.plazas?.sort((a,b) => a.numero.localeCompare(b.numero, undefined, {numeric: true})).map((plaza) => {
                    let style = 'bg-white/5 text-dark-muted border-white/5'; // default
                    if (plaza.estado === 'libre') style = 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20';
                    if (plaza.estado === 'ocupada') style = 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]';
                    if (plaza.estado === 'mantenimiento') style = 'bg-dark-bg text-dark-muted/30 border-dark-border opacity-30';
                    
                    return (
                      <button
                        key={plaza.id_plaza}
                        onClick={() => togglePlazaState(plaza)}
                        title={`Plaza ${plaza.estado}. Click para ${plaza.estado === 'libre' ? 'deshabilitar' : 'habilitar'}`}
                        className={`
                          flex flex-col items-center justify-center p-3 rounded-xl border-2 
                          transition-all duration-300 font-mono font-black text-sm hover:scale-105 active:scale-95
                          ${style}
                        `}
                      >
                        {plaza.numero}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {sectores.length === 0 && (
          <div className="text-center py-20 dark-card border-dashed">
            <p className="text-dark-muted font-bold uppercase tracking-[0.2em]">No hay sectores habilitados</p>
            <p className="text-xs text-dark-muted/50 mt-2">Configure los sectores desde el panel de administración.</p>
          </div>
        )}
      </div>
    </div>
  );
}
