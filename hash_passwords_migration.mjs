import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
    if(line.startsWith('VITE_SUPABASE_URL')) url = line.split('=')[1].replace(/"/g, '').trim();
    if(line.startsWith('VITE_SUPABASE_ANON_KEY')) key = line.split('=')[1].replace(/"/g, '').trim();
});

const supabase = createClient(url, key);

async function main() {
    console.log('Iniciando migración de hasheo de contraseñas...');

    // 1. Obtener administradores
    const { data: admins, error: errAdmins } = await supabase.from('administradores').select('*');
    if (errAdmins) {
        console.error('Error al obtener administradores:', errAdmins);
        return;
    }

    for (const admin of admins) {
        if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
            console.log(`Hasheando contraseña para administrador: ${admin.usuario}`);
            const hashedPassword = bcrypt.hashSync(admin.password, 10);
            const { error } = await supabase
                .from('administradores')
                .update({ password: hashedPassword })
                .eq('id_admin', admin.id_admin);
            if (error) console.error(`Error actualizando admin ${admin.usuario}:`, error);
        } else {
            console.log(`El administrador ${admin.usuario} ya tiene contraseña hasheada.`);
        }
    }

    // 2. Obtener operarios
    const { data: operarios, error: errOps } = await supabase.from('operarios').select('*');
    if (errOps) {
        console.error('Error al obtener operarios:', errOps);
        return;
    }

    for (const operario of operarios) {
        if (!operario.password.startsWith('$2a$') && !operario.password.startsWith('$2b$')) {
            console.log(`Hasheando contraseña para operario: ${operario.usuario}`);
            const hashedPassword = bcrypt.hashSync(operario.password, 10);
            const { error } = await supabase
                .from('operarios')
                .update({ password: hashedPassword })
                .eq('id_operario', operario.id_operario);
            if (error) console.error(`Error actualizando operario ${operario.usuario}:`, error);
        } else {
            console.log(`El operario ${operario.usuario} ya tiene contraseña hasheada.`);
        }
    }
    console.log('Migración completada.');
}

main();
