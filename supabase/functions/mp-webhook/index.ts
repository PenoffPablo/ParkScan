import { createClient } from 'npm:@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (req.method !== 'POST') {
      return new Response('Not a POST request', { status: 200, headers: corsHeaders })
    }

    let paymentId = id;
    let paymentTopic = topic;

    try {
      const bodyText = await req.text();
      if (bodyText) {
        const bodyJson = JSON.parse(bodyText);
        if (bodyJson.type) paymentTopic = bodyJson.type;
        if (bodyJson.action) paymentTopic = bodyJson.action.includes('payment') ? 'payment' : paymentTopic;
        if (bodyJson.data && bodyJson.data.id) paymentId = bodyJson.data.id;
      }
    } catch (e) {
      // Ignorar errores de parseo
    }

    if (paymentTopic === 'payment' && paymentId) {
      console.log(`Webhook triggered para payment ID: ${paymentId}`);

      const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
      if (!accessToken) throw new Error("MP_ACCESS_TOKEN ausente en Secrets");

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: paymentId });
      console.log('Estado real del pago en MP:', paymentData.status);

      if (paymentData.status === 'approved') {
        const externalReference = paymentData.external_reference;

        if (externalReference) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          const supabase = createClient(supabaseUrl, supabaseKey);

          // 1. Buscar el ticket por codigo_qr para obtener id_ticket e id_plaza
          const { data: ticketData, error: findError } = await supabase
            .from('tickets')
            .select('id_ticket, id_plaza, estado')
            .eq('codigo_qr', externalReference)
            .single();

          if (findError || !ticketData) {
            console.error('No se encontró el ticket con referencia:', externalReference, findError);
            return new Response('OK', { status: 200, headers: corsHeaders });
          }

          // Si ya está pagado, no hacer nada (idempotencia)
          if (ticketData.estado === 'pagado') {
            console.log('Ticket ya estaba pagado, ignorando webhook duplicado.');
            return new Response('OK', { status: 200, headers: corsHeaders });
          }

          // 2. Marcar ticket como pagado
          const { error: ticketError } = await supabase
            .from('tickets')
            .update({
              estado: 'pagado',
              hora_salida: new Date().toISOString()
            })
            .eq('id_ticket', ticketData.id_ticket);

          if (ticketError) {
            console.error('Error actualizando ticket:', ticketError);
            throw ticketError;
          }

          // 3. Registrar el pago en la tabla pagos
          const { error: pagoError } = await supabase
            .from('pagos')
            .insert([{
              id_ticket: ticketData.id_ticket,
              monto: paymentData.transaction_amount || 0,
              metodo_pago: 'mercadopago',
              fecha_pago: new Date().toISOString()
            }]);

          if (pagoError) {
            console.error('Error insertando pago:', pagoError);
            // No lanzamos error para no bloquear — el ticket ya fue marcado como pagado
          }

          // 4. Liberar la plaza
          if (ticketData.id_plaza) {
            const { error: plazaError } = await supabase
              .from('plazas')
              .update({ estado: 'libre' })
              .eq('id_plaza', ticketData.id_plaza);

            if (plazaError) {
              console.error('Error liberando plaza:', plazaError);
            } else {
              console.log(`Ticket ${externalReference} pagado. Plaza ${ticketData.id_plaza} liberada.`);
            }
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Error procesando Webhook MP:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
})