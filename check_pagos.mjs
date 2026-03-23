import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
    if(line.startsWith('VITE_SUPABASE_URL')) url = line.split('=')[1].replace(/["\r]/g, '');
    if(line.startsWith('VITE_SUPABASE_ANON_KEY')) key = line.split('=')[1].replace(/["\r]/g, '');
});

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('pagos').select('*').order('fecha_pago', { ascending: false }).limit(5);
  console.log('Pagos:', JSON.stringify(data, null, 2));
}
check();
