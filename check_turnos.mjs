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
  const { data, error } = await supabase.from('turnos').select('*').order('id_turno', { ascending: false }).limit(2);
  console.log('Turnos:', JSON.stringify(data, null, 2));
}
check();
