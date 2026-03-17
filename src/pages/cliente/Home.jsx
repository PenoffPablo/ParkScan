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
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 blur-[120px] rounded-full"></div>

      <div className="mb-12 relative">
        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl mb-6 mx-auto w-max shadow-2xl">
          <Car className="w-16 h-16 text-brand" />
        </div>
        <h1 className="text-6xl font-black text-white mb-2 tracking-tighter leading-none">ParkScan</h1>
      </div>

      <div className={`
        glass-card p-12 mb-12 max-w-sm w-full transition-all duration-700 relative group
        ${sinLugar ? 'border-red-500/30' : 'border-brand/30'}
      `}>
        <div className={`
          absolute inset-0 rounded-2xl opacity-5 transition-opacity duration-700
          ${sinLugar ? 'bg-red-500' : 'bg-brand'}
        `}></div>

        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-muted mb-4">
          Plazas Disponibles
        </h2>

        <div className={`
          text-9xl font-black mb-4 tracking-tighter transition-colors duration-700
          ${sinLugar ? 'text-red-500' : 'text-white'}
        `}>
          {plazasDisponibles}
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${sinLugar ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Habilitadas: {totalPlazas}</p>
        </div>
      </div>

      <button
        disabled={sinLugar || generando}
        onClick={handleImprimirTicket}
        className={`
          flex items-center gap-4 px-10 py-6 rounded-2xl text-xl font-bold text-white shadow-2xl transition-all duration-500 relative overflow-hidden group
          ${(sinLugar || generando)
            ? 'bg-dark-card border border-dark-border opacity-50 cursor-not-allowed'
            : 'bg-brand hover:scale-105 active:scale-95 shadow-brand/40'
          }
        `}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Printer className="w-7 h-7" />
        <span>{generando ? 'Procesando...' : sinLugar ? 'Sin disponibilidad' : 'Imprimir Ticket'}</span>
      </button>

      {/* MODAL DEL TICKET GENERADO */}
      {ticketAsignado && (
        <div className="fixed inset-0 bg-dark-bg/80 flex justify-center items-center z-50 p-4 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-300">
          <div className="bg-dark-card border border-dark-border rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative text-center">
            <button
              onClick={() => setTicketAsignado(null)}
              className="absolute top-6 right-6 text-dark-muted hover:text-white bg-white/5 rounded-full p-2 transition-colors border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white mb-8 tracking-tight">Tu Ticket de Acceso</h3>

            <div className="bg-white rounded-3xl p-8 mb-8 flex flex-col items-center shadow-inner relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-[10px] font-black text-white px-4 py-1 rounded-full uppercase tracking-widest">
                Escanéame
              </div>
              <QRCodeSVG
                value={ticketAsignado.codigo_qr}
                size={180}
                level="Q"
                includeMargin={false}
              />
            </div>

            <p className="font-mono font-bold text-xl text-white tracking-[.25em] mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
              {ticketAsignado.codigo_qr}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-1">Sector</p>
                <p className="text-xl font-black text-white">{ticketAsignado.sectorNombre}</p>
              </div>
              <div className="bg-brand/10 p-5 rounded-2xl border border-brand/20">
                <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Cajón</p>
                <p className="text-3xl font-black text-brand leading-none">{ticketAsignado.plazaNombre}</p>
              </div>
            </div>

            <p className="text-xs text-dark-muted font-medium px-4">Por favor, conserve este ticket para validar su salida en caja.</p>
          </div>
        </div>
      )}

      {/* FOOTER DE ACCESO RÁPIDO */}
      <div className="mt-20 pt-10 border-t border-white/5 flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
        <a href="/pago" className="text-brand hover:scale-105 transition-all">Pagar Estadía</a>
        <a href="/admin/login" className="text-dark-muted hover:text-brand transition-all hover:scale-105">Admin Login</a>
        <a href="/operario/login" className="text-dark-muted hover:text-indigo-500 transition-all hover:scale-105">Staff Access</a>
      </div>
    </div>
  );
}
