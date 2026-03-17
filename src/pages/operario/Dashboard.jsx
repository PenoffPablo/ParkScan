import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Monitor } from 'lucide-react';

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
        .eq('estado', 'disponible')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSectores(data || []);
    } catch (error) {
      console.error('Error fetching disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Cargando monitoreo de plazas...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Monitoreo de Plazas</h2>
      </div>

      <div className="space-y-6">
        {sectores.map((sector) => {
          const plazasLibres = sector.plazas?.filter(p => p.estado === 'libre').length || 0;
          const totalPlazas = sector.capacidad;

          return (
            <div key={sector.id_sector} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">{sector.nombre}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${plazasLibres > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {plazasLibres} de {totalPlazas} libres
                </span>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {sector.plazas?.sort((a,b) => a.numero.localeCompare(b.numero, undefined, {numeric: true})).map((plaza) => {
                    let bgColor = 'bg-green-100 text-green-700 border-green-200'; // libre
                    if (plaza.estado === 'ocupada') bgColor = 'bg-red-100 text-red-700 border-red-200';
                    if (plaza.estado === 'mantenimiento') bgColor = 'bg-slate-200 text-slate-500 border-slate-300 opacity-50';
                    
                    return (
                      <div
                        key={plaza.id_plaza}
                        title={`Plaza ${plaza.estado}`}
                        className={`
                          flex flex-col items-center justify-center p-3 rounded-lg border-2 
                          transition-all duration-200 font-mono font-bold
                          ${bgColor}
                        `}
                      >
                        {plaza.numero}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {sectores.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No hay sectores habilitados actualmente.
          </div>
        )}
      </div>
    </div>
  );
}
