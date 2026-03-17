import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, X, QrCode, CreditCard, UserCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generarTicketPublico } from '../../utils/ticketService';

export default function ClienteHome() {
  const [plazasDisponibles, setPlazasDisponibles] = useState(0);
  const [totalPlazas, setTotalPlazas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [ticketAsignado, setTicketAsignado] = useState(null);

  // Nuevo state para el modal de login de staff
  const [showLoginOptions, setShowLoginOptions] = useState(false);

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
    <div className="min-h-screen bg-dark-bg flex flex-col items-center py-10 px-6 text-center relative overflow-x-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="mb-8 relative mt-auto">
        <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl mb-4 mx-auto w-max shadow-2xl">
          <Car className="w-12 h-12 text-brand" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter leading-none">ParkScan</h1>
      </div>

      <div className={`
        glass-card p-6 md:p-8 mb-10 w-full max-w-md transition-all duration-700 relative group
        ${sinLugar ? 'border-red-500/30' : 'border-brand/30'}
      `}>
        <div className={`
          absolute inset-0 rounded-2xl opacity-5 transition-opacity duration-700
          ${sinLugar ? 'bg-red-500' : 'bg-brand'}
        `}></div>

        <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-dark-muted mb-2">
          Plazas Disponibles
        </h2>

        <div className={`
          text-7xl md:text-8xl font-black mb-2 tracking-tighter transition-colors duration-700
          ${sinLugar ? 'text-red-500' : 'text-white'}
        `}>
          {plazasDisponibles}
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${sinLugar ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Habilitadas: {totalPlazas}</p>
        </div>
      </div>

      {/* 3 BOTONES PRINCIPALES */}
      <div className="flex flex-col md:flex-row justify-center gap-5 w-full max-w-5xl relative z-10 mb-auto">

        {/* BOTÓN 1: Generar QR / Ingreso */}
        <button
          disabled={sinLugar || generando}
          onClick={handleImprimirTicket}
          className={`
            flex flex-col items-center justify-center p-8 rounded-3xl border text-center transition-all duration-500 group relative w-full md:w-1/3 min-h-[220px]
            ${(sinLugar || generando)
              ? 'bg-dark-card border-dark-border opacity-50 cursor-not-allowed'
              : 'bg-brand/10 border-brand/30 hover:bg-brand/20 hover:border-brand shadow-[0_0_30px_rgba(var(--color-brand),0.1)] hover:shadow-[0_0_50px_rgba(var(--color-brand),0.3)] hover:-translate-y-2'
            }
          `}
        >
          <div className="p-5 bg-black/20 rounded-2xl group-hover:scale-110 transition-transform mb-4">
            <QrCode className={`w-10 h-10 ${sinLugar || generando ? 'text-gray-500' : 'text-brand'}`} />
          </div>
          <div>
            <h3 className={`text-2xl font-black mb-2 ${sinLugar || generando ? 'text-gray-400' : 'text-white'}`}>
              {generando ? 'Procesando...' : sinLugar ? 'Sin disponibilidad' : 'Ingresar Vehículo'}
            </h3>
            <p className={`text-sm font-medium ${sinLugar || generando ? 'text-gray-500' : 'text-brand/80'}`}>
              Generar ticket con código QR
            </p>
          </div>
        </button>

        {/* BOTÓN 2: Kiosco de Pago */}
        <a
          href="/pago"
          className="flex flex-col items-center justify-center p-8 rounded-3xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500 text-center transition-all duration-500 group shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:-translate-y-2 relative w-full md:w-1/3 min-h-[220px]"
        >
          <div className="p-5 bg-black/20 rounded-2xl group-hover:scale-110 transition-transform mb-4">
            <CreditCard className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Kiosco de Pago</h3>
            <p className="text-sm font-medium text-blue-400">Abonar estadía antes de salir</p>
          </div>
        </a>

        {/* BOTÓN 3: Login de Personal */}
        <button
          onClick={() => setShowLoginOptions(true)}
          className="flex flex-col items-center justify-center p-8 rounded-3xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500 text-center transition-all duration-500 group shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] hover:-translate-y-2 relative w-full md:w-1/3 min-h-[220px]"
        >
          <div className="p-5 bg-black/20 rounded-2xl group-hover:scale-110 transition-transform mb-4">
            <UserCircle className="w-10 h-10 text-purple-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Acceso Staff</h3>
            <p className="text-sm font-medium text-purple-400">Login Administrador / Operario</p>
          </div>
        </button>

      </div>

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

      {/* MODAL DE LOGIN OPTIONS */}
      {showLoginOptions && (
        <div className="fixed inset-0 bg-dark-bg/80 flex justify-center items-center z-50 p-4 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-300">
          <div className="bg-dark-card border border-dark-border rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] relative text-center">
            <button
              onClick={() => setShowLoginOptions(false)}
              className="absolute top-6 right-6 text-dark-muted hover:text-white bg-white/5 rounded-full p-2 transition-colors border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-purple-500/20 rounded-2xl">
                <UserCircle className="w-10 h-10 text-purple-500" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Acceso de Personal</h3>
            <p className="text-dark-muted mb-8 text-sm">Seleccione su perfil de ingreso</p>

            <div className="flex flex-col gap-4">
              <a href="/admin/login" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 text-white font-bold transition-all text-lg flex items-center justify-center gap-3">
                Administrador
              </a>
              <a href="/operario/login" className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 text-white font-bold transition-all text-lg flex items-center justify-center gap-3">
                Operario
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
