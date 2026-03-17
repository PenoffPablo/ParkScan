import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generarTicketPublico } from '../../utils/ticketService';

export default function ClienteHome() {
  const [plazasDisponibles, setPlazasDisponibles] = useState(0);
  const [totalPlazas, setTotalPlazas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [ticketAsignado, setTicketAsignado] = useState(null);

  useEffect(() => {
    fetchDisponibilidad();
    
    const plazasSubscription = supabase
      .channel('public_plazas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plazas' }, () => {
        fetchDisponibilidad();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plazasSubscription);
    };
  }, []);

  const fetchDisponibilidad = async () => {
    try {
      const { data: plazas, error } = await supabase
        .from('plazas')
        .select(`
          estado,
          sectores!inner(estado)
        `)
        .eq('sectores.estado', 'disponible')
        .neq('estado', 'mantenimiento');

      if (error) throw error;
      
      const libres = plazas.filter(p => p.estado === 'libre').length;
      setTotalPlazas(plazas.length);
      setPlazasDisponibles(libres);
    } catch (error) {
      console.error('Error fetching plazas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirTicket = async () => {
    setGenerando(true);
    const resultado = await generarTicketPublico();
    setGenerando(false);

    if (resultado.success) {
      setTicketAsignado({
        ...resultado.ticket,
        plazaNombre: resultado.plaza.numero,
        sectorNombre: resultado.plaza.sectores.nombre
      });
    } else {
      alert(`Error: ${resultado.error}`);
    }
  };

  if (loading) return <div className="text-gray-500 text-center mt-20">Analizando espacio...</div>;

  const sinLugar = plazasDisponibles === 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12">
        <Car className="w-16 h-16 text-accent mx-auto mb-4" />
        <h1 className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">ParkScan</h1>
        <p className="text-xl text-slate-500 font-medium">Estacionamiento Automatizado</p>
      </div>

      <div className={`
        bg-white rounded-3xl p-10 shadow-xl border-2 mb-12 max-w-sm w-full transition-colors duration-500
        ${sinLugar ? 'border-red-200 shadow-red-100' : 'border-green-200 shadow-green-100'}
      `}>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">
          Lugares Disponibles
        </h2>
        <div className={`text-8xl font-black mb-2 ${sinLugar ? 'text-red-500' : 'text-green-500'}`}>
          {plazasDisponibles}
        </div>
        <p className="text-slate-500 font-medium">de {totalPlazas} plazas habilitadas</p>
      </div>

      <button
        disabled={sinLugar || generando}
        onClick={handleImprimirTicket}
        className={`
          flex items-center gap-3 px-8 py-5 rounded-2xl text-xl font-bold text-white shadow-lg transition-all duration-300
          ${(sinLugar || generando)
            ? 'bg-slate-300 cursor-not-allowed opacity-70' 
            : 'bg-accent hover:bg-opacity-90 hover:scale-105 active:scale-95 shadow-accent/20'
          }
        `}
      >
        <Printer className="w-6 h-6" />
        {generando ? 'Generando...' : sinLugar ? 'Estacionamiento Lleno' : 'Imprimir Ticket de Ingreso'}
      </button>

      {/* MODAL DEL TICKET GENERADO */}
      {ticketAsignado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button 
              onClick={() => setTicketAsignado(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tu Ticket de Ingreso</h3>
            
            <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 mb-8 flex flex-col items-center">
              <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
                 <QRCodeSVG 
                    value={ticketAsignado.codigo_qr} 
                    size={160}
                    level="Q"
                    includeMargin={true}
                 />
              </div>
              <p className="text-sm text-gray-400 mb-1">CÓDIGO DE BARRA</p>
              <p className="font-mono font-bold text-lg text-gray-800 tracking-widest">{ticketAsignado.codigo_qr}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-400 font-bold uppercase">Sector</p>
                <p className="text-lg font-bold text-indigo-900">{ticketAsignado.sectorNombre}</p>
              </div>
              <div className="bg-accent-bg p-4 rounded-xl border border-accent/20">
                <p className="text-xs text-accent/70 font-bold uppercase">Plaza asignada</p>
                <p className="text-2xl font-black text-accent">{ticketAsignado.plazaNombre}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-medium">Por favor, conserve este ticket o tome una captura para salir y realizar el pago.</p>
          </div>
        </div>
      )}

      {/* FOOTER DE ACCESO RÁPIDO (SOLO PARA DESARROLLO/TESTEO) */}
      <div className="mt-16 pt-8 border-t border-slate-200 flex gap-6 text-sm">
        <a href="/admin/login" className="text-slate-400 hover:text-accent transition-colors font-medium">Portal Admin</a>
        <a href="/operario/login" className="text-slate-400 hover:text-indigo-600 transition-colors font-medium">Portal Operario</a>
      </div>
    </div>
  );
}
