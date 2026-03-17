import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, QrCode, ArrowRight, ArrowLeft, CheckCircle2, Clock, Car, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Inicialización de Mercado Pago removida: se maneja vía Supabase Edge Functions

export default function ClientePago() {
  const [codigoTicket, setCodigoTicket] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagado, setPagado] = useState(false);
  const [monto, setMonto] = useState(0);
  const [preferenceId, setPreferenceId] = useState(null);
  const [initPoint, setInitPoint] = useState('');

  const buscarTicket = async () => {
    if (!codigoTicket) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          plazas (
            numero,
            sectores (nombre)
          )
        `)
        .eq('codigo_qr', codigoTicket.toUpperCase())
        .single();

      if (error) throw new Error('Ticket no encontrado o ya procesado');
      if (data.estado === 'pagado') throw new Error('Este ticket ya ha sido abonado');

      // Calcular monto ($1000 por hora o fracción)
      const entrada = new Date(data.hora_entrada);
      const ahora = new Date();
      const diffMs = ahora - entrada;
      const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
      const total = diffHrs * 1000;

      setMonto(total);
      setTicket(data);
      
      // Generar preferencia de pago REAL
      generarPreferencia(data, total);
    } catch (error) {
      alert(error.message);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const generarPreferencia = async (ticketData, totalMonto) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-preference', {
        body: {
          title: `Estadía Estacionamiento - Plaza ${ticketData.plazas.numero}`,
          quantity: 1,
          price: totalMonto,
          external_reference: ticketData.codigo_qr
        }
      });

      if (error) {
        // Intentar obtener el mensaje de error del cuerpo de la respuesta si es posible
        if (error.context && typeof error.context.json === 'function') {
           const details = await error.context.json();
           throw new Error(details.error || details.message || error.message);
        }
        throw error;
      }
      
      console.log('Preferencia MP generada vía Edge Function:', data);
      
      if (data.init_point) {
        setPreferenceId(data.id);
        setInitPoint(data.init_point);
      } else {
        throw new Error('No se recibió la URL de pago de Mercado Pago');
      }
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error: ' + (error.message || 'Fallo al comunicarse con Mercado Pago.'));
    }
  };

  const confirmarPago = async () => {
    setLoading(true);
    try {
      // 1. Registrar el pago
      const { error: errorPago } = await supabase
        .from('pagos')
        .insert([{
          id_ticket: ticket.id_ticket,
          monto: monto,
          metodo_pago: 'qr',
          fecha_pago: new Date().toISOString()
        }]);

      if (errorPago) throw errorPago;

      // 2. Marcar ticket como pagado
      const { error: errorTicket } = await supabase
        .from('tickets')
        .update({ 
          estado: 'pagado',
          hora_salida: new Date().toISOString()
        })
        .eq('id_ticket', ticket.id_ticket);

      if (errorTicket) throw errorTicket;

      // 3. Liberar la plaza
      const { error: errorPlaza } = await supabase
        .from('plazas')
        .update({ estado: 'libre' })
        .eq('id_plaza', ticket.id_plaza);

      if (errorPlaza) throw errorPlaza;

      setPagado(true);
    } catch (error) {
      alert('Error al procesar el pago: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (pagado) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 bg-gradient-to-b from-dark-bg to-green-950/20">
        <div className="dark-card p-12 max-w-sm w-full text-center animate-in zoom-in duration-500 border-green-500/30">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">¡Pago Exitoso!</h2>
          <p className="text-dark-muted mb-8">Su plaza ha sido liberada. Tiene 15 minutos para retirar su vehículo.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-4 text-lg"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6 lg:p-12 relative overflow-hidden flex flex-col items-center">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/5 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Botón Volver Embebido Superpuesto */}
      <button 
        onClick={() => window.location.href = '/'}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors shadow-lg group backdrop-blur-md"
      >
        <ArrowLeft className="w-5 h-5 text-dark-muted group-hover:text-white transition-colors" />
        <span className="hidden sm:inline">Volver</span>
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-14 lg:mt-0">
        
        {/* Left Side: Info & Input */}
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
              <CreditCard className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Portal de Pago</h1>
          </div>

          <p className="text-dark-muted text-lg mb-10 leading-relaxed font-medium">
            Ingrese el código alfanumérico de su ticket para calcular su estadía y abonar mediante Mercado Pago.
          </p>

          {!ticket ? (
            <div className="dark-card p-8 border-brand/10 bg-white/[0.02]">
              <label className="block text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] mb-4">Código del Ticket</label>
              <div className="flex gap-4">
                <input 
                  type="text"
                  placeholder="PS-XXXX-XXXX"
                  value={codigoTicket}
                  onChange={(e) => setCodigoTicket(e.target.value)}
                  className="input-dark flex-1 py-4 text-xl font-mono uppercase tracking-widest text-center"
                />
                <button 
                  onClick={buscarTicket}
                  disabled={loading || !codigoTicket}
                  className="btn-primary px-8 flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <ArrowRight className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="dark-card p-8 bg-white/[0.02] border-brand/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white">{ticket.plazas.numero}</h3>
                    <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest">{ticket.plazas.sectores.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Ingreso</p>
                    <p className="text-sm font-mono text-white">{new Date(ticket.hora_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-4 border-y border-white/5 mb-6">
                   <Clock className="w-5 h-5 text-brand" />
                   <p className="text-sm font-bold text-dark-muted">Tiempo transcurrido: <span className="text-white">{Math.floor((new Date() - new Date(ticket.hora_entrada)) / (1000 * 60))} min</span></p>
                </div>

                <div className="flex justify-between items-end">
                  <p className="text-dark-muted font-bold">Total a abonar</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-brand text-2xl font-bold">$</span>
                    <span className="text-5xl font-black text-white">{monto}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setTicket(null)}
                className="text-xs text-dark-muted font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                ← Cambiar Ticket
              </button>
            </div>
          )}
        </div>

        {/* Right Side: QR Simulated */}
        <div className="animate-in slide-in-from-right duration-700">
          <div className="dark-card p-10 bg-white/[0.02] border-white/5 relative overflow-hidden group">
            {/* MP Blue Gradient Background */}
            <div className="absolute inset-0 bg-blue-600/5 opacity-20 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#009EE3] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">Escanee para Pagar</h3>
              <p className="text-xs text-dark-muted font-bold uppercase tracking-widest mb-10">Interface Mercado Pago</p>

              <div className="bg-white p-6 rounded-[2rem] mb-10 shadow-2xl relative border-4 border-[#009EE3]/10">
                {!ticket && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-[2rem] z-20">
                    <p className="px-6 text-[10px] font-black text-black/40 uppercase tracking-widest leading-relaxed text-center">Primero valide su ticket<br/>en el panel izquierdo</p>
                  </div>
                )}
                {ticket && !initPoint && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-[2rem] z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#009EE3]/20 border-t-[#009EE3] rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-[#009EE3] uppercase tracking-widest">Generando Pago...</p>
                    </div>
                  </div>
                )}
                <QRCodeSVG 
                  value={initPoint || 'https://www.mercadopago.com.ar'}
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {ticket && (
                <div className="flex flex-col items-center gap-3 mb-8 w-full">
                  <a 
                    href={initPoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-[#009EE3] font-bold text-sm uppercase tracking-widest hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir en Mercado Pago (Web)
                  </a>
                  <p className="text-[10px] text-dark-muted font-medium text-center px-6">
                    Escanee el código con su cámara o con la App de Mercado Pago
                  </p>
                </div>
              )}

              <button 
                disabled={!ticket || loading}
                onClick={confirmarPago}
                className={`
                  w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all
                  ${ticket ? 'bg-[#009EE3] text-white hover:bg-[#0086c3] shadow-lg shadow-blue-500/20' : 'bg-white/5 text-dark-muted cursor-not-allowed border border-white/5'}
                `}
              >
                {loading ? 'Procesando...' : 'Simular Confirmación de Pago'}
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Logo_Mercado_Pago.png" alt="MP" className="h-4" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
