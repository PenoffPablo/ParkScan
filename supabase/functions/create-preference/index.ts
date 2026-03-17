import { MercadoPagoConfig, Preference } from 'npm:mercadopago'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Manejo de peticiones preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, quantity, price, external_reference } = await req.json()

    // Obtener el token de los Secrets de Supabase
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    
    if (!accessToken) {
      console.error('ERROR: MP_ACCESS_TOKEN no encontrado en variables de entorno')
      return new Response(
        JSON.stringify({ error: 'Configuración incompleta en Supabase (falta Token)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)

    const body = {
      items: [
        {
          title: title,
          quantity: Number(quantity),
          unit_price: Number(price),
          currency_id: 'ARS',
        },
      ],
      back_urls: {
        success: 'https://www.google.com', // Usamos una URL válida para testing
        failure: 'https://www.google.com',
        pending: 'https://www.google.com',
      },
      // auto_return: 'approved', // Comentado temporalmente por error de validación
      external_reference: external_reference
    }

    console.log('Creando preferencia con body:', JSON.stringify(body))

    const result = await preference.create({ body })

    console.log('Preferencia creada exitosamente:', result.id)

    return new Response(
      JSON.stringify({ id: result.id, init_point: result.init_point }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error en la Edge Function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
