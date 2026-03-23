import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
    if(line.startsWith('VITE_SUPABASE_URL')) url = line.split('=')[1].replace(/"/g, '').trim();
    if(line.startsWith('VITE_SUPABASE_ANON_KEY')) key = line.split('=')[1].replace(/"/g, '').trim();
});

const supabase = createClient(url, key);

async function main() {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('hora_entrada', { ascending: false })
        .limit(2);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Últimos tickets:', tickets.map(t => ({ id: t.codigo_qr, estado: t.estado, hora: t.hora_salida })));
    }
}
main();
