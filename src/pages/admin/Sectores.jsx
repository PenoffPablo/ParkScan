import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Play, Pause } from 'lucide-react';

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
      // Fetcheamos sectores y sus plazas correspondientes
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

      // Generar plazas automáticamente para el sector creado
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
      fetchSectores(); // Recargar datos
    } catch (error) {
      console.error('Error creando sector:', error.message);
      alert('Error creando el sector (quizás el nombre ya existe)');
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
    // Si está ocupada no se puede pausar (solo si está libre)
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
    if(!window.confirm('¿Seguro que deseas eliminar el sector? Se borrarán todas sus plazas también.')) return;
    
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

  if (loading) return <div className="text-gray-500">Cargando sectores...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Sectores y Plazas</h2>

      {/* Formulario nuevo sector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold mb-4">Añadir Nuevo Sector</h3>
        <form onSubmit={handleCrearSector} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (Ej: Piso 1)</label>
            <input
              type="text"
              required
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (Nro. de Plazas)</label>
            <input
              type="number"
              min="1"
              max="1000"
              required
              value={nuevaCapacidad}
              onChange={(e) => setNuevaCapacidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 flex items-center gap-2 h-[42px]"
          >
            <Plus className="w-5 h-5" />
            Crear Sector
          </button>
        </form>
      </div>

      {/* Listado de sectores */}
      <div className="space-y-6">
        {sectores.map((sector) => (
          <div key={sector.id_sector} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Cabecera Sector */}
            <div className={`p-4 border-b flex justify-between items-center ${sector.estado === 'mantenimiento' ? 'bg-orange-50' : 'bg-slate-50'}`}>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {sector.nombre}
                  {sector.estado === 'mantenimiento' && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200">En Pausa</span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Capacidad Total: {sector.capacidad} plazas</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSectorState(sector)}
                  title={sector.estado === 'disponible' ? 'Pausar Sector Completo' : 'Reactivar Sector'}
                  className={`p-2 rounded-lg transition-colors ${sector.estado === 'disponible' ? 'text-orange-600 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`}
                >
                  {sector.estado === 'disponible' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => eliminarSector(sector.id_sector)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar Sector"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid de Plazas */}
            <div className="p-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {sector.plazas?.sort((a,b) => a.numero.localeCompare(b.numero, undefined, {numeric: true})).map((plaza) => {
                  let bgColor = 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'; // libre
                  if (plaza.estado === 'ocupada') bgColor = 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed';
                  if (plaza.estado === 'mantenimiento') bgColor = 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300';
                  
                  return (
                    <button
                      key={plaza.id_plaza}
                      onClick={() => togglePlazaState(plaza)}
                      title={plaza.estado === 'libre' ? 'Poner en mantenimiento' : plaza.estado === 'mantenimiento' ? 'Habilitar plaza' : 'Plaza ocupada'}
                      disabled={plaza.estado === 'ocupada'}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-lg border-2 
                        transition-all duration-200 font-mono font-bold
                        ${bgColor}
                      `}
                    >
                      {plaza.numero}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {sectores.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No hay sectores creados aún.
          </div>
        )}
      </div>
    </div>
  );
}
