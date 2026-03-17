import { supabase } from '@/lib/supabase';

export async function generarTicketPublico() {
  try {
    // 1. Buscar una plaza libre en un sector disponible
    const { data: plazasLibres, error: errorPlazas } = await supabase
      .from('plazas')
      .select('id_plaza, numero, sectores!inner(id_sector, nombre, estado)')
      .eq('estado', 'libre')
      .eq('sectores.estado', 'disponible')
      .limit(1);

    if (errorPlazas) throw errorPlazas;
    if (!plazasLibres || plazasLibres.length === 0) {
      throw new Error("No hay plazas disponibles");
    }

    const plazaAsignada = plazasLibres[0];

    // 2. Transacción de negocios: Marcar plaza como ocupada y crear ticket
    // En Supabase DB podríamos usar una RPC, pero para MVP lo hacemos en 2 pasos
    
    // a. Marcar ocupada
    const { error: errorUpdate } = await supabase
      .from('plazas')
      .update({ estado: 'ocupada' })
      .eq('id_plaza', plazaAsignada.id_plaza);
      
    if (errorUpdate) throw errorUpdate;

    // b. Crear ticket (El JWT/QR string será el ID del ticket para simplificar)
    const nuevoCodigoQR = `PS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

    const { data: ticket, error: errorTicket } = await supabase
      .from('tickets')
      .insert([{
        id_plaza: plazaAsignada.id_plaza,
        codigo_qr: nuevoCodigoQR,
        estado: 'activo'
        // El resto (patente, operario, turno) quedará null al ser ingreso automático de cliente
      }])
      .select()
      .single();

    if (errorTicket) {
      // Rollback manual si falla la inserción del ticket (revertimos la plaza a libre)
       await supabase.from('plazas').update({ estado: 'libre' }).eq('id_plaza', plazaAsignada.id_plaza);
       throw errorTicket;
    }

    return {
      success: true,
      ticket: ticket,
      plaza: plazaAsignada
    };

  } catch (err) {
    console.error("Error generando ticket:", err);
    return { success: false, error: err.message };
  }
}
