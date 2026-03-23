import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Car, CreditCard, Ticket, ArrowUpRight, Clock, CalendarDays, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const [rangoTiempo, setRangoTiempo] = useState('hoy'); // 'hoy', 'semana', 'quincena', 'mes'
  const [stats, setStats] = useState({
    ocupacion: 0,
    recaudacion: 0,
    ticketsHoy: 0
  });
  const [pagosRecientes, setPagosRecientes] = useState([]);
  const [desgloseOperarios, setDesgloseOperarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // Trigger to reload data on time change

  // Helper para la fecha de inicio según rango
  const getStartDate = (rango) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (rango === 'semana') d.setDate(d.getDate() - 7);
    if (rango === 'quincena') d.setDate(d.getDate() - 15);
    if (rango === 'mes') d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  };

  const determinarTurno = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const hora = new Date(fechaStr).getHours();
    if (hora >= 6 && hora < 14) return 'Mañana';
    if (hora >= 14 && hora < 22) return 'Tarde';
    return 'Noche';
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // 1. Ocupación Inicial (Ocupación es el presente siempre, sin importar el rango)
        const { data: plazas } = await supabase.from('plazas').select('estado');
        let ratio = 0;
        if (plazas && plazas.length > 0) {
          const ocupadas = plazas.filter(p => p.estado === 'ocupada').length;
          ratio = Math.round((ocupadas / plazas.length) * 100);
        }

        // 2. Diccionario de Operarios (Nombres reales)
        const { data: operariosData } = await supabase.from('operarios').select('id_operario, nombre, apellido');
        const operariosMap = {};
        if (operariosData) {
           operariosData.forEach(op => operariosMap[op.id_operario] = `${op.nombre} ${op.apellido}`);
        }

        // 2.5 Tablas de Turnos para asignación automática de pagos Kiosko/QR
        const { data: turnosData } = await supabase.from('turnos').select('*');
        const turnosMap = turnosData || [];
        
        const { data: otData } = await supabase.from('operario_turnos').select('*');
        const operarioTurnos = otData || [];

        // 3. Pagos según período
        const startDate = getStartDate(rangoTiempo);
        const { data: pagosData } = await supabase
          .from('pagos')
          .select('*, tickets(codigo_qr)')
          .gte('fecha_pago', startDate)
          .order('fecha_pago', { ascending: false });

        let recaudacionTotal = 0;
        let ticketsPagados = 0;
        let lista = [];
        let mapDesglose = {};

        if (pagosData && pagosData.length > 0) {
           ticketsPagados = pagosData.length;
           lista = pagosData.slice(0, 15); // Mostrar máx últimos 15

           pagosData.forEach(p => {
             const m = p.monto || 0;
             recaudacionTotal += m;

             let nombreCajero = 'Terminal Automática';

             if (p.id_operario && operariosMap[p.id_operario]) {
                nombreCajero = operariosMap[p.id_operario];
             } else {
                // Asignar al operario en turno según la hora del pago
                const horaStr = new Date(p.fecha_pago).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                let idTurnoCorrespondiente = null;

                for (const t of turnosMap) {
                    const hInicio = t.hora_inicio.slice(0, 5);
                    const hFin = t.hora_fin.slice(0, 5);
                    if (hInicio < hFin) {
                        if (horaStr >= hInicio && horaStr < hFin) {
                            idTurnoCorrespondiente = t;
                            break;
                        }
                    } else { // Cruza la medianoche (Noche)
                        if (horaStr >= hInicio || horaStr < hFin) {
                            idTurnoCorrespondiente = t;
                            break;
                        }
                    }
                }

                if (idTurnoCorrespondiente) {
                    const fechaLocal = new Date(p.fecha_pago);
                    // Si el pago se hizo de madrugada en un turno noche, le pertenece al calendario del día anterior
                    if (idTurnoCorrespondiente.hora_inicio > idTurnoCorrespondiente.hora_fin && horaStr < idTurnoCorrespondiente.hora_fin) {
                        fechaLocal.setDate(fechaLocal.getDate() - 1);
                    }
                    const fechaString = fechaLocal.toISOString().split('T')[0];

                    const asignacion = operarioTurnos.find(ot => ot.id_turno === idTurnoCorrespondiente.id_turno && ot.fecha === fechaString);
                    if (asignacion && operariosMap[asignacion.id_operario]) {
                        nombreCajero = operariosMap[asignacion.id_operario];
                    }
                }
             }

             mapDesglose[nombreCajero] = (mapDesglose[nombreCajero] || 0) + m;
             p.nombre_operario = nombreCajero; 
           });
        }

        // Convertir diccionario de desglose a array y ordenarlo
        const arrayDesglose = Object.keys(mapDesglose).map(nombre => ({
           nombre,
           monto: mapDesglose[nombre],
           porcentaje: recaudacionTotal > 0 ? Math.round((mapDesglose[nombre] / recaudacionTotal) * 100) : 0
        })).sort((a,b) => b.monto - a.monto);

        setStats({ ocupacion: ratio, recaudacion: recaudacionTotal, ticketsHoy: ticketsPagados });
        setDesgloseOperarios(arrayDesglose);
        setPagosRecientes(lista);

      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // 4. Suscripciones Real-Time
    const plazasSub = supabase
      .channel('admin-plazas')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'plazas' }, async () => {
         const { data } = await supabase.from('plazas').select('estado');
         if (data) {
           const o = data.filter(p => p.estado === 'ocupada').length;
           setStats(prev => ({ ...prev, ocupacion: Math.round((o / data.length) * 100) }));
         }
      })
      .subscribe();

    const pagosSub = supabase
      .channel('admin-pagos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pagos' }, () => {
         // Alentamos un refetch completo para actualizar tanto el monto como el desglose
         // sin complicar la estructura local.
         setRefetchTrigger(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plazasSub);
      supabase.removeChannel(pagosSub);
    };
  }, [rangoTiempo, refetchTrigger]);

  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0
    }).format(monto || 0);
  };

  const formatearHora = (fechaStr) => {
    if (!fechaStr) return '--:--';
    return new Date(fechaStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-20">
      
      {/* HEADER: Título y Filtros de Tiempo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Ticket className="w-8 h-8 text-accent relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight appearance-none mb-1">Centro de Analíticas</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Sincronizado Múltiples Turnos</p>
            </div>
          </div>
        </div>

        {/* Filtro Selector Periodo */}
        <div className="flex bg-dark-card border border-dark-border p-1 rounded-2xl self-start w-full lg:w-auto overflow-x-auto">
           {[
             { id: 'hoy', label: 'Hoy' },
             { id: 'semana', label: '7 Días' },
             { id: 'quincena', label: '15 Días' },
             { id: 'mes', label: 'Mes' }
           ].map(opcion => (
             <button
                key={opcion.id}
                onClick={() => setRangoTiempo(opcion.id)}
                className={`flex-1 lg:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap
                  ${rangoTiempo === opcion.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-dark-muted hover:text-white hover:bg-white/5'}
                `}
             >
               {opcion.label}
             </button>
           ))}
        </div>
      </div>
      
      {/* ... Spinner intermedio ... */}
      {loading && <div className="p-10 text-brand animate-pulse font-black tracking-widest text-center mt-20 uppercase">Procesando cubos de datos...</div>}

      {!loading && (
        <>
          {/* Tarjetas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Ocupación es presente */}
            <div className="dark-card p-10 relative overflow-hidden group border-brand/10 transition-colors bg-white/[0.01]">
              <div className="absolute -top-10 -right-10 p-10 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                <Car className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">Eficiencia de Ocupación</p>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-white leading-none">{stats.ocupacion}%</span>
                </div>
                <div className="mt-8 w-full bg-white/5 h-2 rounded-full overflow-hidden shadow-inner">
                   <div className={`h-full transition-all duration-1000 ease-out ${stats.ocupacion > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : stats.ocupacion > 50 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} style={{width: `${stats.ocupacion}%`}}></div>
                </div>
              </div>
            </div>

            {/* Recaudación ajustada al período */}
            <div className="dark-card p-10 relative overflow-hidden group border-accent/10 sm:col-span-2 lg:col-span-1 bg-white/[0.01]">
              <div className="absolute -bottom-10 -right-10 p-10 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 -rotate-12">
                <Wallet className="w-40 h-40" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">
                   Ingresos Brutos ({rangoTiempo === 'hoy' ? 'Hoy' : rangoTiempo === 'semana' ? '7 Días' : rangoTiempo === 'quincena' ? '15 Días' : 'Este Mes'})
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-5xl lg:text-6xl font-black text-white leading-none break-all">{formatearDinero(stats.recaudacion)}</span>
                </div>
                <p className="text-[11px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest mt-8 bg-green-500/10 w-max px-3 py-1 rounded-full">
                   <ArrowUpRight className="w-3 h-3" /> Sumando en Vivo
                </p>
              </div>
            </div>

            {/* Flujo ajustado al período */}
            <div className="dark-card p-10 relative overflow-hidden group border-white/5 bg-white/[0.01]">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110">
                <Users className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] mb-4">Flujo Histórico de Tickets</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black text-white leading-none">{stats.ticketsHoy}</span>
                  <span className="text-xs font-bold text-dark-muted mb-2 tracking-widest">TICKETS</span>
                </div>
                <div className="mt-8 flex gap-1 h-3 items-end">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className={`flex-1 rounded-t-sm transition-all ${rangoTiempo === 'hoy' ? 'bg-brand/30' : 'bg-accent/30'}`} style={{height: `${Math.max(10, Math.min(100, (stats.ticketsHoy/(i+1))*10))}%`}}></div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* SECCIÓN NUEVA: Desglose por Turno / Operador */}
            <div className="xl:col-span-1 flex flex-col gap-6">
               <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                 <CalendarDays className="w-5 h-5 text-accent" /> Control de Turnos
               </h3>
               
               <div className="dark-card p-8 border-accent/10 flex-1 relative overflow-hidden bg-accent/5">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] rounded-full"></div>
                 
                 {desgloseOperarios.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-dark-muted font-bold text-xs uppercase tracking-widest text-center">No hay ingresos registrados<br/>en este período</div>
                 ) : (
                    <div className="space-y-6 relative z-10">
                      {desgloseOperarios.map((op, idx) => (
                        <div key={idx} className="group">
                           <div className="flex justify-between items-end mb-2">
                             <span className="text-sm font-bold text-white uppercase tracking-wider">{op.nombre}</span>
                             <span className="text-lg font-black text-accent">{formatearDinero(op.monto)}</span>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="flex-1 bg-dark-bg h-2 rounded-full overflow-hidden">
                                <div className="bg-accent h-full rounded-full transition-all duration-1000" style={{width: `${op.porcentaje}%`}}></div>
                             </div>
                             <span className="text-[10px] font-black text-dark-muted w-10 text-right">{op.porcentaje}%</span>
                           </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>

            {/* SECCIÓN DE LA TABLA (AHORA OCUPA LAS OTRAS DOS COLUMNAS) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                 <Clock className="w-5 h-5 text-dark-muted" /> Transacciones Recientes
              </h3>
              
              <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-2xl flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Hora</th>
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Turno</th>
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Operario</th>
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Ticket Ref.</th>
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Método</th>
                        <th className="px-8 py-5 text-[10px] font-black text-dark-muted uppercase tracking-[0.2em] text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pagosRecientes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-10 text-center text-dark-muted text-sm font-bold uppercase tracking-widest">
                            Sin transacciones
                          </td>
                        </tr>
                      ) : (
                        pagosRecientes.map((pago, idx) => (
                          <tr 
                            key={pago.id_pago || idx} 
                            className="hover:bg-white/[0.02] transition-colors group animate-in fade-in slide-in-from-left-4 duration-500"
                          >
                            <td className="px-8 py-5 text-white/50 font-mono text-sm whitespace-nowrap">{formatearHora(pago.fecha_pago)}</td>
                            <td className="px-8 py-5">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md
                                ${determinarTurno(pago.fecha_pago) === 'Mañana' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                                ${determinarTurno(pago.fecha_pago) === 'Tarde' ? 'bg-orange-500/10 text-orange-500' : ''}
                                ${determinarTurno(pago.fecha_pago) === 'Noche' ? 'bg-blue-500/10 text-blue-500' : ''}
                                ${determinarTurno(pago.fecha_pago) === 'N/A' ? 'bg-white/5 text-dark-muted' : ''}
                              `}>
                                {determinarTurno(pago.fecha_pago)}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-bold text-white whitespace-nowrap">{pago.nombre_operario}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs font-bold tracking-widest whitespace-nowrap">
                                {pago.tickets?.codigo_qr || `ID-${pago.id_ticket}`}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                ${pago.metodo_pago === 'efectivo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                                ${pago.metodo_pago?.includes('mercadopago') || pago.metodo_pago === 'qr' ? 'bg-[#009EE3]/10 text-[#009EE3] border-[#009EE3]/20' : ''}
                                ${!pago.metodo_pago ? 'bg-white/5 text-dark-muted border-white/10' : ''}
                              `}>
                                {pago.metodo_pago || 'Desconocido'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-white tracking-wider">
                              {formatearDinero(pago.monto)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
