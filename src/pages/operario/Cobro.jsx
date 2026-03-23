import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CreditCard, CheckCircle2 } from 'lucide-react';

export default function OperarioCobro() {
  const [codigoQR, setCodigoQR] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState('');
  const [resultado, setResultado] = useState(null);

  // Costo por hora harcodeado para este MVP (pueden ser 1000 ARS, por ejemplo)
  const COSTO_POR_HORA = 1000;

  // Sincronización en tiempo real para evitar cobrar doble si el cliente lo paga desde su portal
  useEffect(() => {
    if (!ticket) return;

    const ticketSubscription = supabase
      .channel(`ticket-status-cobro-${ticket.id_ticket}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `id_ticket=eq.${ticket.id_ticket}`
      }, payload => {
        if (payload.new.estado === 'pagado') {
          setResultado(`Atención: Este ticket acaba de ser abonado exitosamente a través de otra plataforma (Ej: Portal Cliente). La plaza ha sido liberada.`);
          setTicket(null);
          setCodigoQR('');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSubscription);
    };
  }, [ticket]);

  const buscarTicket = async (e) => {
    e.preventDefault();
    if (!codigoQR) return;

    setError('');
    setTicket(null);
    setResultado(null);

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          plazas ( id_plaza, numero, sectores (nombre) )
        `)
        .eq('codigo_qr', codigoQR)
        .single();

      if (error || !data) throw new Error('Ticket no encontrado o código inválido');
      if (data.estado === 'pagado') throw new Error('Este ticket ya fue pagado y procesado');

      // Calcular tiempo y costo (simulado hasta el momento actual)
      const entrada = new Date(data.hora_entrada);
      const salidaValidacion = new Date();

      const horasMilisegundos = salidaValidacion - entrada;
      const horasEstacionado = Math.max(1, Math.ceil(horasMilisegundos / (1 * 60 * 60))); // Mínimo 1 hora cobrada
      const montoTotal = horasEstacionado * COSTO_POR_HORA;

      setTicket({
        ...data,
        horasCalculadas: horasEstacionado,
        montoCalulado: montoTotal,
        salidaSimulada: salidaValidacion
      });

    } catch (err) {
      setError(err.message);
    }
  };

  const registrarPago = async (metodo) => {
    setProcesando(true);
    try {
      const sesionOperario = JSON.parse(localStorage.getItem('parkscan_operario'));

      // Control de concurrencia: revisar instantes previos al cobro si ya fue pagado
      const { data: checkTicket, error: errCheck } = await supabase
        .from('tickets')
        .select('estado')
        .eq('id_ticket', ticket.id_ticket)
        .single();

      if (errCheck) throw errCheck;
      if (checkTicket.estado === 'pagado') {
        throw new Error('Este ticket acaba de ser abonado por otra vía. Recargue la información.');
      }

      // 1. Marcar ticket como pagado con hora de salida
      const { error: errTicket } = await supabase
        .from('tickets')
        .update({
          estado: 'pagado',
          hora_salida: ticket.salidaSimulada.toISOString()
        })
        .eq('id_ticket', ticket.id_ticket);

      if (errTicket) throw errTicket;

      // 2. Liberar la plaza
      const { error: errPlaza } = await supabase
        .from('plazas')
        .update({ estado: 'libre' })
        .eq('id_plaza', ticket.id_plaza);

      if (errPlaza) throw errPlaza;

      // 3. Registrar tabla de pagos ('efectivo' o 'qr_app')
      // NOTA: 'qr_app' asimila a MercadoPago/Transferencia
      const { error: errPago } = await supabase
        .from('pagos')
        .insert([{
          monto: ticket.montoCalulado,
          metodo_pago: metodo,
          id_ticket: ticket.id_ticket,
          id_operario: sesionOperario.id_operario
        }]);

      if (errPago) throw errPago;

      setResultado(`¡Cobro exitoso de $${ticket.montoCalulado} mediante ${metodo.toUpperCase()}! La plaza ${ticket.plazas.numero} ha sido liberada.`);
      setTicket(null);
      setCodigoQR('');

    } catch (err) {
      setError('Error al procesar el pago: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
          <CreditCard className="w-8 h-8 text-brand" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Centro de Facturación</h2>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Gestión de cobro y egreso</p>
        </div>
      </div>

      <div className="dark-card p-10 mb-8 border-brand/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Search className="w-32 h-32" />
        </div>

        <label className="block text-xs font-black text-dark-muted uppercase tracking-[0.2em] mb-4 ml-1">
          Identificador del Ticket
        </label>
        <form onSubmit={buscarTicket} className="flex gap-4 relative z-10">
          <input
            type="text"
            className="input-dark flex-1 py-4 text-xl font-mono font-black"
            placeholder="PS-XXXX-XXXX"
            value={codigoQR}
            onChange={(e) => setCodigoQR(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            className="btn-primary px-8 flex items-center gap-3"
          >
            <Search className="w-5 h-5" />
            <span>Validar</span>
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold animate-in bounce-in">
            {error}
          </div>
        )}

        {resultado && (
          <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-4 text-green-400 animate-in zoom-in">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold leading-relaxed">{resultado}</p>
          </div>
        )}
      </div>

      {ticket && (
        <div className="dark-card border-brand/30 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="bg-brand/10 p-6 border-b border-brand/20 flex justify-between items-center">
            <h3 className="text-brand font-black text-xs uppercase tracking-widest">Liquidación de Servicio</h3>
            <span className="text-[10px] font-black p-1 px-3 bg-brand/20 rounded-full">ESTADO: PENDIENTE</span>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-1">Ubicación</p>
                <p className="font-bold text-white">{ticket.plazas.sectores.nombre} - <span className="text-brand">{ticket.plazas.numero}</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-1">Hora Ingreso</p>
                <p className="font-bold text-white uppercase italic">
                  {new Date(ticket.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-1">Duración</p>
                <p className="text-xl font-black text-white">{ticket.horasCalculadas} <span className="text-xs text-dark-muted">HORAS</span></p>
              </div>
              <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10">
                <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Base Tarifaria</p>
                <p className="font-bold text-white italic">${COSTO_POR_HORA} <span className="text-[10px] text-dark-muted lowercase italic">x hora</span></p>
              </div>
            </div>

            <div className="border-y border-white/5 py-8 mb-10 flex justify-between items-center">
              <span className="text-white/50 font-black text-sm uppercase tracking-[0.2em]">Total Adeudado</span>
              <div className="text-right">
                <span className="text-6xl font-black text-white leading-none">${ticket.montoCalulado}</span>
                <p className="text-[10px] font-bold text-brand uppercase tracking-widest mt-1">Saldado en Pesos</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                disabled={procesando}
                onClick={() => registrarPago('efectivo')}
                className="btn-secondary flex-1 py-5 flex items-center justify-center gap-2 group"
              >
                <div className="w-2 h-2 rounded-full bg-dark-muted group-hover:bg-brand transition-colors"></div>
                <span>Efectivo</span>
              </button>
              <button
                disabled={procesando}
                onClick={() => registrarPago('qr')}
                className="btn-primary flex-1 py-5 flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5 shadow-2xl" />
                <span>Pago Digital</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
