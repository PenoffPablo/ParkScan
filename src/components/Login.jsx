import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, User } from 'lucide-react';

export default function Login({ role }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Como no usamos Auth de Supabase directo sino tablas custom por el DER
      const tabla = role === 'admin' ? 'administradores' : 'operarios';
      
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('Credenciales incorrectas');
      }

      // Guardar sesión en local (MVP simple)
      localStorage.setItem(`parkscan_${role}`, JSON.stringify(data));
      
      // Redirigir al dashboard correspondiente
      if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/operario/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card rounded-2xl border border-dark-border shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">ParkScan</h2>
          <p className="text-dark-muted font-medium">
            Acceso {role === 'admin' ? 'Administrador' : 'Operario'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-dark-muted mb-2 ml-1">Usuario</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                <User className="h-5 w-5 text-dark-muted" />
              </div>
              <input
                type="text"
                required
                className="input-dark block w-full pl-12 pr-4 py-3"
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-dark-muted mb-2 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand">
                <Lock className="h-5 w-5 text-dark-muted" />
              </div>
              <input
                type="password"
                required
                className="input-dark block w-full pl-12 pr-4 py-3"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
