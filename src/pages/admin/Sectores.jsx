import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, LayoutGrid, Play, Pause } from 'lucide-react';

export default function AdminSectores() {
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para nuevo sector
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCapacidad, setNuevaCapacidad] = useState('');

  useEffect(() => {
    fetchSectores();
  }, []);

  const fetchSectores = async () => {
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
      console.error('Error fetching sectores:', error.message);
      alert('Error cargando los sectores');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSector = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevaCapacidad) return;

    try {
      const { data: sectorData, error: sectorError } = await supabase
        .from('sectores')
        .insert([{
          nombre: nuevoNombre,
          capacidad: parseInt(nuevaCapacidad)
        }])
        .select()
        .single();

      if (sectorError) throw sectorError;

      const plazasParaInsertar = Array.from({ length: parseInt(nuevaCapacidad) }, (_, i) => ({
        numero: `${sectorData.nombre.charAt(0).toUpperCase()}${i + 1}`,
        id_sector: sectorData.id_sector,
        estado: 'libre'
      }));

      const { error: plazasError } = await supabase
        .from('plazas')
        .insert(plazasParaInsertar);

      if (plazasError) throw plazasError;

      setNuevoNombre('');
      setNuevaCapacidad('');
      fetchSectores();
    } catch (error) {
      console.error('Error creando sector:', error.message);
      alert(`No se pudo crear el sector: ${error.message}`);
    }
  };

  const toggleSectorState = async (sector) => {
    try {
      const nuevoEstado = sector.estado === 'disponible' ? 'mantenimiento' : 'disponible';
      const { error } = await supabase
        .from('sectores')
        .update({ estado: nuevoEstado })
        .eq('id_sector', sector.id_sector);

      if (error) throw error;
      fetchSectores();
    } catch (error) {
      console.error('Error cambiando estado:', error.message);
    }
  };

  const togglePlazaState = async (plaza) => {
    if (plaza.estado === 'ocupada') {
      alert('No se puede pausar una plaza que está actualmente ocupada.');
      return;
    }

    try {
      const nuevoEstado = plaza.estado === 'libre' ? 'mantenimiento' : 'libre';
      const { error } = await supabase
        .from('plazas')
        .update({ estado: nuevoEstado })
        .eq('id_plaza', plaza.id_plaza);

      if (error) throw error;
      fetchSectores();
    } catch (error) {
      console.error('Error cambiando estado de plaza:', error.message);
    }
  };

  const eliminarSector = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar el sector? Se borrarán todas sus plazas también.')) return;

    try {
      const { error } = await supabase
        .from('sectores')
        .delete()
        .eq('id_sector', id);

      if (error) throw error;
      fetchSectores();
    } catch (error) {
      console.error('Error eliminando sector:', error.message);
      alert('No se puede eliminar un sector que contenga tickets activos o históricos.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      <p className="text-dark-muted font-bold text-sm uppercase tracking-widest text-center">Configurando Infraestructura...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
          <LayoutGrid className="w-8 h-8 text-brand" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Arquitectura de Espacios</h2>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Gestión de niveles, sectores y plazas</p>
        </div>
      </div>

      <div className="dark-card p-10 mb-12 border-brand/10 relative overflow-hidden group">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-6">Desplegar Nuevo Sector</h3>
        <form onSubmit={handleCrearSector} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 ml-1">Letra del Sector</label>
            <input
              type="text"
              required
              maxLength={1}
              placeholder="Ej: A"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value.toUpperCase())}
              className="input-dark w-full py-3 text-center uppercase font-black"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 ml-1">Capacidad Estimada</label>
            <input
              type="number"
              min="1"
              max="1000"
              required
              placeholder="000"
              value={nuevaCapacidad}
              onChange={(e) => setNuevaCapacidad(e.target.value)}
              className="input-dark w-full py-3"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Inicializar Sector</span>
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-10">
        {sectores.map((sector) => (
          <div key={sector.id_sector} className="dark-card overflow-hidden border-brand/5 group hover:border-brand/20 transition-all duration-500">
            <div className={`p-8 border-b border-dark-border flex justify-between items-center bg-white/[0.01] group-hover:bg-brand/[0.02] transition-colors`}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">{sector.nombre}</h3>
                  {sector.estado === 'mantenimiento' && (
                    <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest">En Pausa</span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${sector.estado === 'disponible' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </div>
                <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest">Configuración: {sector.capacidad} Unidades</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => toggleSectorState(sector)}
                  title={sector.estado === 'disponible' ? 'Pausar Sector Completo' : 'Reactivar Sector'}
                  className={`p-3 rounded-xl transition-all border ${sector.estado === 'disponible' ? 'border-orange-500/20 text-orange-500 hover:bg-orange-500/5' : 'border-green-500/20 text-green-500 hover:bg-green-500/5'}`}
                >
                  {sector.estado === 'disponible' ? <Pause className="w-5 h-5 shadow-[0_0_10px_rgba(249,115,22,0.2)]" /> : <Play className="w-5 h-5 shadow-[0_0_10px_rgba(34,197,94,0.2)]" />}
                </button>
                <button
                  onClick={() => eliminarSector(sector.id_sector)}
                  className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 border border-white/5 rounded-xl transition-all"
                  title="Dar de Baja Sector"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-10 bg-dark-bg/30">
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
                {sector.plazas?.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })).map((plaza) => {
                  let style = 'bg-white/5 text-dark-muted/20 border-white/5';
                  if (plaza.estado === 'libre') style = 'bg-green-500/5 text-green-500/80 border-green-500/10 hover:bg-green-500/10 hover:border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.02)]';
                  if (plaza.estado === 'ocupada') style = 'bg-red-500/10 text-red-500 border-red-500/20 cursor-not-allowed opacity-80';
                  if (plaza.estado === 'mantenimiento') style = 'bg-dark-card text-dark-muted/30 border-dark-border hover:bg-white/5 hover:text-white';

                  return (
                    <button
                      key={plaza.id_plaza}
                      onClick={() => togglePlazaState(plaza)}
                      disabled={plaza.estado === 'ocupada'}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2 
                        transition-all duration-300 font-mono font-black text-sm relative group/btn
                        ${style}
                      `}
                    >
                      <span>{plaza.numero}</span>
                      <div className={`absolute top-1 right-1 w-1 h-1 rounded-full ${plaza.estado === 'libre' ? 'bg-green-500' : plaza.estado === 'ocupada' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {sectores.length === 0 && (
          <div className="text-center py-24 dark-card border-dashed">
            <div className="bg-white/5 p-6 rounded-full w-max mx-auto mb-6">
              <Plus className="w-12 h-12 text-dark-muted" />
            </div>
            <p className="text-dark-muted font-black uppercase tracking-[0.3em]">No hay infraestructura configurada</p>
            <p className="text-xs text-dark-muted/50 mt-4 italic">Utilice el panel superior para desplegar su primer sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}
