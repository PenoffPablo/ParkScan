import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aszxuwktoeivxxmxunxf.supabase.co';
const supabaseKey = 'sb_publishable_aqp_tJNZd42jOQj4OZQSrw_YTTisf1j';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Verificando esquema de "sectores" ---');
    const { data, error } = await supabase
        .from('sectores')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error al consultar tabla:', error.message);
    } else {
        console.log('Columnas encontradas:', Object.keys(data[0] || {}));
    }
    console.log('---------------------------------------');
}

checkSchema();
