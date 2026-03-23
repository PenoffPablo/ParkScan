import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ScanLine, ShieldCheck, XCircle, ClockAlert, ArrowLeft } from 'lucide-react';

export default function ClienteSalida() {
  const [codigoQR, setCodigoQR] = useState('');
  const [loading, setLoading] = useState(false);
  const [estadoValidacion, setEstadoValidacion] = useState(null); 
  const [mensaje, setMensaje] = useState('');
  const inputRef = useRef(null);

  // Mantener el foco en el input para que los pequeños escáneres USB siempre funcionen
  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      if(!loading && !estadoValidacion) inputRef.current?.focus();
    }, 2000);
    return () => clearInterval(interval);
  }, [loading, estadoValidacion]);

  const procesarSalida = async (e) => {
    e?.preventDefault();
    if (!codigoQR) return;

    setLoading(true);
    setEstadoValidacion(null);
    setMensaje('');

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id_ticket, estado, hora_salida')
        .eq('codigo_qr', codigoQR.toUpperCase().trim())
        .single();

      if (error || !data) {
        setEstadoValidacion('error');
        setMensaje('CÓDIGO DE TICKET INVÁLIDO O NO ENCONTRADO');
        return resetAfterDelay();
      }

      if (data.estado === 'pendiente') {
         setEstadoValidacion('pendiente');
         setMensaje('TICKET NO ABONADO. DIRÍJASE A LA TERMINAL DE PAGO.');
         resetAfterDelay();
      } else if (data.estado === 'finalizado') {
         setEstadoValidacion('finalizado');
         setMensaje('ESTE TICKET YA HA SIDO UTILIZADO.');
         resetAfterDelay();
      } else if (data.estado === 'pagado') {
         const tiempoPagado = new Date(data.hora_salida); 
         const msTranscurridos = new Date() - tiempoPagado;
         const minutos = Math.floor(msTranscurridos / (1000 * 60));

         if (minutos > 15) {
             setEstadoValidacion('vencido');
             setMensaje(`TIEMPO DE TOLERANCIA EXCEDIDO (${minutos} min). DEBE ABONAR ESTADÍA ADICIONAL.`);
             resetAfterDelay();
         } else {
             // AUTO-FINALIZAR y ABRIR BARRERA
             const { error: updateError } = await supabase
               .from('tickets')
               .update({ estado: 'finalizado' })
               .eq('id_ticket', data.id_ticket);

             if (updateError) throw updateError;
             
             setEstadoValidacion('autorizado');
             setMensaje('¡PAGO VERIFICADO! BARRERA ABIERTA, BUEN VIAJE.');
             resetAfterDelay(5000);
         }
      }
    } catch (err) {
      setEstadoValidacion('error');
      setMensaje('ERROR EN EL SISTEMA: ' + err.message);
      resetAfterDelay();
    }
  };

  const resetAfterDelay = (ms = 4000) => {
    setTimeout(() => {
      setCodigoQR('');
      setEstadoValidacion(null);
      setMensaje('');
      setLoading(false);
      inputRef.current?.focus();
    }, ms);
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6 lg:p-12 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/5 blur-[150px] rounded-full pointer-events-none"></div>

      <button
        onClick={() => window.location.href = '/'}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors shadow-lg group backdrop-blur-md"
      >
        <ArrowLeft className="w-5 h-5 text-dark-muted group-hover:text-white transition-colors" />
        <span className="hidden sm:inline">Volver</span>
      </button>

      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12">
           <div className="w-24 h-24 bg-brand/10 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-brand/20 shadow-[0_0_50px_rgba(0,158,227,0.15)]">
             <ScanLine className="w-12 h-12 text-brand" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Terminal de Salida</h1>
           <p className="text-dark-muted font-bold text-lg uppercase tracking-widest">Aproxime su ticket al lector láser de barrera</p>
        </div>

        {!estadoValidacion && !loading && (
          <form onSubmit={procesarSalida} className="relative z-10 mx-auto w-full max-w-xl">
            <input
              ref={inputRef}
              type="text"
              className="input-dark w-full py-6 text-3xl md:text-4xl font-mono uppercase tracking-[0.3em] text-center border-white/10 bg-white/[0.02]"
              placeholder="PS-XXXX"
              value={codigoQR}
              onChange={(e) => setCodigoQR(e.target.value.toUpperCase())}
              autoFocus
            />
            <button type="submit" className="hidden">Procesar</button>
          </form>
        )}

        {loading && !estadoValidacion && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-20 h-20 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(0,158,227,0.2)]"></div>
            <p className="text-brand font-black tracking-widest uppercase animate-pulse">Verificando barrera...</p>
          </div>
        )}

        {estadoValidacion && (
          <div className={`
            p-12 text-center rounded-[3rem] border-4 animate-in zoom-in-95 duration-500 shadow-2xl backdrop-blur-sm
            ${estadoValidacion === 'autorizado' ? 'border-green-500/50 bg-green-500/10 shadow-green-500/20' : ''}
            ${estadoValidacion === 'pendiente' || estadoValidacion === 'finalizado' || estadoValidacion === 'error' ? 'border-red-500/50 bg-red-500/10 shadow-red-500/20' : ''}
            ${estadoValidacion === 'vencido' ? 'border-orange-500/50 bg-orange-500/10 shadow-orange-500/20' : ''}
          `}>
             <div className="flex justify-center mb-8">
                {estadoValidacion === 'autorizado' && <ShieldCheck className="w-32 h-32 md:w-40 md:h-40 text-green-500" />}
                {(estadoValidacion === 'pendiente' || estadoValidacion === 'finalizado' || estadoValidacion === 'error') && <XCircle className="w-32 h-32 md:w-40 md:h-40 text-red-500" />}
                {estadoValidacion === 'vencido' && <ClockAlert className="w-32 h-32 md:w-40 md:h-40 text-orange-500" />}
             </div>
             <h3 className={`text-2xl md:text-5xl font-black uppercase tracking-wide leading-tight
                ${estadoValidacion === 'autorizado' ? 'text-green-400' : ''}
                ${estadoValidacion === 'pendiente' || estadoValidacion === 'finalizado' || estadoValidacion === 'error' ? 'text-red-400' : ''}
                ${estadoValidacion === 'vencido' ? 'text-orange-400' : ''}
             `}>
               {mensaje}
             </h3>
          </div>
        )}

      </div>
    </div>
  );
}
