import { supabase } from '@/lib/supabase';

export const sectorService = {
  // Read
  obtenerSectores: async () => {
    const { data, error } = await supabase
      .from('sectores')
      .select(`*, plazas (*)`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create
  crearSector: async (nombre, capacidad) => {
    // 1. Crear sector
    const { data: sectorData, error: sectorError } = await supabase
      .from('sectores')
      .insert([{
        nombre: nombre,
        capacidad: parseInt(capacidad)
      }])
      .select()
      .single();

    if (sectorError) throw sectorError;

    // 2. Crear plazas
    const plazasParaInsertar = Array.from({ length: parseInt(capacidad) }, (_, i) => ({
      numero: `${nombre.charAt(0).toUpperCase()}${i + 1}`,
      id_sector: sectorData.id_sector,
      estado: 'libre'
    }));

    const { error: plazasError } = await supabase
      .from('plazas')
      .insert(plazasParaInsertar);

    if (plazasError) throw plazasError;

    return sectorData;
  },

  // Update
  cambiarEstadoSector: async (id_sector, estadoActual) => {
    const nuevoEstado = estadoActual === 'disponible' ? 'mantenimiento' : 'disponible';
    const { data, error } = await supabase
      .from('sectores')
      .update({ estado: nuevoEstado })
      .eq('id_sector', id_sector)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete
  eliminarSector: async (id_sector) => {
    const { data, error } = await supabase
      .from('sectores')
      .delete()
      .eq('id_sector', id_sector)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
