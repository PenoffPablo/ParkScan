import { supabase } from '@/lib/supabase';

/**
 * Obtiene la lista de todos los operarios ordenada por nombre.
 */
export async function getOperarios() {
  const { data, error } = await supabase
    .from('operarios')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Guarda (inserta o actualiza) un operario.
 * @param {object} operarioData - Datos del operario.
 * @param {string|number} [id] - ID opcional para actualización.
 */
export async function saveOperario(operarioData, id = null) {
  if (id) {
    const { data, error } = await supabase
      .from('operarios')
      .update(operarioData)
      .eq('id_operario', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('operarios')
      .insert([operarioData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Elimina un operario por su ID.
 * @param {string|number} id - ID del operario a eliminar.
 */
export async function deleteOperario(id) {
  const { error } = await supabase
    .from('operarios')
    .delete()
    .eq('id_operario', id);

  if (error) throw error;
  return true;
}
