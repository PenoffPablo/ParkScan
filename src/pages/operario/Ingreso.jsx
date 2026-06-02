import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QrCode, Car, CheckCircle2, ArrowRight, AlertCircle, Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function OperarioIngreso() {
  const [patente, setPatente] = useState('');
  const [sectores, setSectores] = useState([]);
  const [plazas, setPlazas] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');
  const [ticketAsignado, setTicketAsignado] = useState(null);

  useEffect(() => {
    fetchSectoresYPlazas();
  }, []);

  const fetchSectoresYPlazas = async () => {
    try {
      setLoadingConfig(true);
      setError('');
      // Obtener sectores disponibles
      const { data: sectoresData, error: errSectores } = await supabase
        .from('sectores')
        .select('*')
        .eq('estado', 'disponible');

      if (errSectores) throw errSectores;
      setSectores(sectoresData || []);

      // Obtener todas las plazas libres
      const { data: plazasData, error: errPlazas } = await supabase
        .from('plazas')
        .select('*')
        .eq('estado', 'libre');

      if (errPlazas) throw errPlazas;
      setPlazas(plazasData || []);

      if (sectoresData?.length > 0) {
        setSelectedSector(sectoresData[0].id_sector);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      setError('Error al cargar la configuración de plazas');
    } finally {
      setLoadingConfig(false);
    }
  };

  // Filtrar plazas por sector seleccionado
  const plazasDisponibles = plazas.filter(p => p.id_sector === selectedSector);

  // Auto-seleccionar la primera plaza disponible cuando cambia el sector
  useEffect(() => {
    if (plazasDisponibles.length > 0) {
      setSelectedPlaza(plazasDisponibles[0].id_plaza);
    } else {
      setSelectedPlaza('');
    }
  }, [selectedSector, plazas]);

  const registrarIngreso = async (e) => {
    e.preventDefault();
    if (!patente.trim()) {
      setError('Debe ingresar la patente del vehículo');
      return;
    }
    if (!selectedPlaza) {
      setError('Debe seleccionar una plaza disponible');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sesionOperario = JSON.parse(localStorage.getItem('parkscan_operario'));
      if (!sesionOperario) throw new Error('Sesión de operario no válida. Por favor, inicie sesión.');

      // 1. Validar/Crear vehículo
      let id_vehiculo = null;
      const cleanPatente = patente.trim().toUpperCase();

      const { data: existingVehiculo, error: errFindVehiculo } = await supabase
        .from('vehiculos')
        .select('id_vehiculo')
        .eq('patente', cleanPatente)
        .maybeSingle();

      if (errFindVehiculo) throw errFindVehiculo;

      if (existingVehiculo) {
        id_vehiculo = existingVehiculo.id_vehiculo;
      } else {
        const { data: newVehiculo, error: errNewVehiculo } = await supabase
          .from('vehiculos')
          .insert({ patente: cleanPatente })
          .select()
          .single();

        if (errNewVehiculo) throw errNewVehiculo;
        id_vehiculo = newVehiculo.id_vehiculo;
      }

      // 2. Obtener turno activo de hoy para el operario (si existe)
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: activeTurn } = await supabase
        .from('operario_turnos')
        .select('id_turno')
        .eq('id_operario', sesionOperario.id_operario)
        .eq('fecha', todayStr)
        .limit(1)
        .maybeSingle();

      const id_turno = activeTurn?.id_turno || null;

      // 3. Generar código QR único para el ticket
      const nuevoCodigoQR = `PS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

      // 4. Actualizar plaza a ocupada
      const { error: errUpdatePlaza } = await supabase
        .from('plazas')
        .update({ estado: 'ocupada' })
        .eq('id_plaza', selectedPlaza);

      if (errUpdatePlaza) throw errUpdatePlaza;

      // 5. Insertar ticket
      const { data: ticket, error: errTicket } = await supabase
        .from('tickets')
        .insert([{
          id_plaza: selectedPlaza,
          codigo_qr: nuevoCodigoQR,
          estado: 'activo',
          id_vehiculo: id_vehiculo,
          id_operario: sesionOperario.id_operario,
          id_turno: id_turno
        }])
        .select(`
          *,
          plazas ( numero, sectores ( nombre ) )
        `)
        .single();

      if (errTicket) {
        // Rollback plaza if ticket creation fails
        await supabase.from('plazas').update({ estado: 'libre' }).eq('id_plaza', selectedPlaza);
        throw errTicket;
      }

      // Éxito: asignar datos del ticket para el modal
      setTicketAsignado({
        ...ticket,
        patente: cleanPatente,
        plazaNombre: ticket.plazas.numero,
        sectorNombre: ticket.plazas.sectores.nombre
      });

      // Limpiar formulario y recargar plazas
      setPatente('');
      fetchSectoresYPlazas();

    } catch (err) {
      console.error(err);
      setError('Error al registrar ingreso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingConfig) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      <p className="text-dark-muted font-bold text-sm uppercase tracking-widest">Cargando disponibilidad...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl">
          <QrCode className="w-8 h-8 text-brand" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Ingreso Manual</h2>
          <p className="text-dark-muted font-bold text-xs uppercase tracking-widest">Registrar entrada de vehículo</p>
        </div>
      </div>

      <div className="dark-card p-10 mb-8 border-brand/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Car className="w-32 h-32" />
        </div>

        <form onSubmit={registrarIngreso} className="space-y-6 relative z-10">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-3 animate-in bounce-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-dark-muted uppercase tracking-[0.2em] mb-2 ml-1">
              Patente del Vehículo
            </label>
            <input
              type="text"
              required
              className="input-dark w-full py-4 text-xl font-mono font-black"
              placeholder="Ej. AAA111"
              value={patente}
              onChange={(e) => setPatente(e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-dark-muted uppercase tracking-[0.2em] mb-2 ml-1">
                Sector
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="input-dark w-full px-4 py-3 min-h-[48px] text-sm appearance-none cursor-pointer"
              >
                {sectores.map(s => (
                  <option key={s.id_sector} value={s.id_sector}>{s.nombre}</option>
                ))}
                {sectores.length === 0 && <option value="">Sin sectores disponibles</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-dark-muted uppercase tracking-[0.2em] mb-2 ml-1">
                Plaza Libre
              </label>
              <select
                value={selectedPlaza}
                onChange={(e) => setSelectedPlaza(e.target.value)}
                disabled={plazasDisponibles.length === 0}
                className="input-dark w-full px-4 py-3 min-h-[48px] text-sm appearance-none cursor-pointer disabled:opacity-50"
              >
                {plazasDisponibles.map(p => (
                  <option key={p.id_plaza} value={p.id_plaza}>Cajón {p.numero}</option>
                ))}
                {plazasDisponibles.length === 0 && <option value="">Sin plazas en este sector</option>}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || sectores.length === 0 || plazasDisponibles.length === 0}
            className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-3 text-lg font-bold"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Registrar Entrada</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* MODAL DEL TICKET GENERADO (APTO PARA IMPRIMIR) */}
      {ticketAsignado && (
        <div className="fixed inset-0 bg-dark-bg/85 flex justify-center items-center z-50 p-4 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-300 print:bg-white print:absolute print:inset-0 print:p-0 print:backdrop-blur-none">
          <div className="bg-dark-card border border-dark-border rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative text-center print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:w-full print:p-8">
            
            <button
              onClick={() => setTicketAsignado(null)}
              className="absolute top-6 right-6 text-dark-muted hover:text-white bg-white/5 rounded-full p-2 transition-colors border border-white/5 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white mb-6 tracking-tight print:text-black">Comprobante de Ingreso</h3>

            <div className="bg-white rounded-3xl p-6 mb-6 flex flex-col items-center shadow-inner relative print:shadow-none print:border print:border-gray-200">
              <QRCodeSVG
                value={ticketAsignado.codigo_qr}
                size={160}
                level="Q"
                includeMargin={false}
                className="w-full h-auto max-w-[160px]"
              />
            </div>

            <p className="font-mono font-bold text-xl text-white tracking-[.25em] mb-6 bg-white/5 p-4 rounded-xl border border-white/5 print:text-black print:bg-gray-100 print:border-gray-300">
              {ticketAsignado.codigo_qr}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 print:bg-gray-50 print:border-gray-200">
                <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-1 print:text-gray-500">Patente</p>
                <p className="text-lg font-black text-white print:text-black">{ticketAsignado.patente}</p>
              </div>
              <div className="bg-brand/10 p-4 rounded-2xl border border-brand/20 print:bg-gray-50 print:border-gray-200">
                <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1 print:text-brand">Cajón</p>
                <p className="text-2xl font-black text-brand print:text-black">{ticketAsignado.plazaNombre}</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6 text-left text-xs space-y-2 print:bg-gray-50 print:border-gray-200 print:text-black">
              <div className="flex justify-between">
                <span className="text-dark-muted font-bold print:text-gray-500">Sector:</span>
                <span className="text-white font-bold print:text-black">{ticketAsignado.sectorNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted font-bold print:text-gray-500">Ingreso:</span>
                <span className="text-white font-bold print:text-black">
                  {new Date(ticketAsignado.hora_entrada).toLocaleDateString()} {new Date(ticketAsignado.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex gap-4 print:hidden">
              <button
                onClick={() => setTicketAsignado(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/5"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
