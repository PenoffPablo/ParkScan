import { useState } from 'react';
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
      const horasEstacionado = Math.max(1, Math.ceil(horasMilisegundos / (1000 * 60 * 60))); // Mínimo 1 hora cobrada
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Caja y Egreso de Vehículos</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Escanear o Ingresar Código QR del Ticket
        </label>
        <form onSubmit={buscarTicket} className="flex gap-3">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg uppercase tracking-wider font-mono focus:ring-accent focus:border-accent"
            placeholder="PS-1A2B-3C4D5"
            value={codigoQR}
            onChange={(e) => setCodigoQR(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 flex items-center gap-2 font-bold"
          >
            <Search className="w-5 h-5" />
            Buscar
          </button>
        </form>

        {error && <p className="text-red-600 mt-4 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
        {resultado && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3 text-green-800">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-green-600" />
            <p className="font-medium">{resultado}</p>
          </div>
        )}
      </div>

      {ticket && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="bg-indigo-50 p-4 border-b border-indigo-100">
            <h3 className="text-indigo-900 font-bold text-lg">Detalle del Servicio</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Sector</p>
                <p className="font-bold text-gray-900">{ticket.plazas.sectores.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plaza</p>
                <p className="font-bold text-gray-900">{ticket.plazas.numero}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingreso</p>
                <p className="font-medium text-gray-900">
                  {new Date(ticket.hora_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiempo Estadía</p>
                <p className="font-bold text-accent">{ticket.horasCalculadas} Horas</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mb-8 flex justify-between items-center">
              <span className="text-gray-500 font-medium text-lg">Total a Pagar:</span>
              <span className="text-4xl font-black text-gray-900">${ticket.montoCalulado}</span>
            </div>

            <div className="flex gap-4">
              <button
                disabled={procesando}
                onClick={() => registrarPago('efectivo')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                Cobrar en Efectivo
              </button>
              <button
                disabled={procesando}
                onClick={() => registrarPago('qr')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                Pago QR / Digital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
