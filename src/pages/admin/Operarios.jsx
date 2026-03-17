import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, CalendarClock, User, Check, X, Watch, Clock } from 'lucide-react';

export default function AdminOperarios() {
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para CRUD Operario
  const [isModalOperarioOpen, setIsModalOperarioOpen] = useState(false);
  const [editingOperario, setEditingOperario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    password: '',
    estado: 'activo'
  });

  // Estados para Turnos
  const [isModalTurnosOpen, setIsModalTurnosOpen] = useState(false);
  const [operarioSeleccionado, setOperarioSeleccionado] = useState(null);
  const [turnosMaestros, setTurnosMaestros] = useState([]); // Mañana, Tarde, Noche
  const [turnosAsignados, setTurnosAsignados] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [nuevoTurno, setNuevoTurno] = useState({
    fecha: '',
    id_turno: ''
  });

  useEffect(() => {
    fetchOperarios();
  }, []);

  const fetchOperarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operarios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setOperarios(data || []);
    } catch (error) {
      alert('Error cargando operarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // =============== CRUD OPERARIOS ===============
  
  const handleOpenModal = (operario = null) => {
    if (operario) {
      setEditingOperario(operario);
      setFormData({
        nombre: operario.nombre,
        apellido: operario.apellido,
        usuario: operario.usuario,
        password: '', // Por seguridad no mostramos el password viejo, si lo deja vacío no se actualiza
        estado: operario.estado
      });
    } else {
      setEditingOperario(null);
      setFormData({ nombre: '', apellido: '', usuario: '', password: '', estado: 'activo' });
    }
    setIsModalOperarioOpen(true);
  };

  const handleSaveOperario = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        usuario: formData.usuario,
        estado: formData.estado
      };

      // Solo actualizar password si el admin escribió algo
      if (formData.password?.trim() !== '') {
        dataToSave.password = formData.password;
      }

      if (editingOperario) {
        const { error } = await supabase
          .from('operarios')
          .update(dataToSave)
          .eq('id_operario', editingOperario.id_operario);
        if (error) throw error;
      } else {
        if (!formData.password) throw new Error("Debe asignar una contraseña al nuevo operario");
        const { error } = await supabase
          .from('operarios')
          .insert([dataToSave]);
        if (error) throw error;
      }

      setIsModalOperarioOpen(false);
      fetchOperarios();
    } catch (error) {
      alert('Error guardando operario: ' + error.message);
    }
  };

  const handleDeleteOperario = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este operario? También se eliminarán sus turnos asignados.')) return;
    try {
      const { error } = await supabase
        .from('operarios')
        .delete()
        .eq('id_operario', id);
      
      if (error) throw error;
      fetchOperarios();
    } catch (error) {
      alert('Error eliminando operario: ' + error.message);
    }
  };

  // =============== GESTIÓN DE TURNOS ===============

  const handleOpenTurnos = async (operario) => {
    setOperarioSeleccionado(operario);
    setIsModalTurnosOpen(true);
    setNuevoTurno({ fecha: '', id_turno: '' });
    fetchTurnosData(operario.id_operario);
  };

  const fetchTurnosData = async (idOperario) => {
    try {
      setLoadingTurnos(true);
      
      // Obtener todos los turnos disponibles (Mañana, Tarde, Noche)
      const { data: maestrosData } = await supabase.from('turnos').select('*');
      setTurnosMaestros(maestrosData || []);

      if (maestrosData?.length > 0 && !nuevoTurno.id_turno) {
         setNuevoTurno(prev => ({ ...prev, id_turno: maestrosData[0].id_turno }));
      }

      // Obtener los turnos asignados al operario
      const { data: asignadosData, error } = await supabase
        .from('operario_turnos')
        .select(`
           *,
           turnos (nombre_turno, hora_inicio, hora_fin)
        `)
        .eq('id_operario', idOperario)
        .order('fecha', { ascending: false });

      if (error) {
        console.warn("Tabla operario_turnos inexistente", error);
        setTurnosAsignados([]);
      } else {
         setTurnosAsignados(asignadosData || []);
      }
    } catch (error) {
      console.error(error);
      setTurnosAsignados([]);
    } finally {
      setLoadingTurnos(false);
    }
  };

  const handleAddTurno = async (e) => {
    e.preventDefault();
    if(!nuevoTurno.id_turno) return alert("Selecciona un turno");
    try {
      const { error } = await supabase
        .from('operario_turnos')
        .insert([{
          id_operario: operarioSeleccionado.id_operario,
          id_turno: nuevoTurno.id_turno,
          fecha: nuevoTurno.fecha,
          estado: 'programado'
        }]);

      if (error) throw error;
      setNuevoTurno({ fecha: '', id_turno: turnosMaestros[0]?.id_turno || '' });
      fetchTurnosData(operarioSeleccionado.id_operario);
    } catch (error) {
      alert('Error asignando turno. Verifica haber ejecutado el SQL: ' + error.message);
    }
  };

  const handleDeleteTurno = async (idAsignacion) => {
    try {
      const { error } = await supabase
        .from('operario_turnos')
        .delete()
        .eq('id_asignacion', idAsignacion);
      
      if (error) throw error;
      fetchTurnosData(operarioSeleccionado.id_operario);
    } catch (error) {
      alert('Error eliminando asignación: ' + error.message);
    }
  };

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-dark-card p-6 rounded-2xl border border-dark-border">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <User className="text-brand w-6 h-6" />
            Gestión de Personal
          </h2>
          <p className="text-dark-muted mt-1">Administración de operarios y asignación de turnos laborales.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary flex items-center gap-2 px-6"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Operario</span>
        </button>
      </div>

      {/* Grid de Operarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {operarios.map((op) => (
          <div key={op.id_operario} className="bg-dark-card rounded-2xl border border-dark-border p-5 hover:border-brand/30 transition-colors group shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black text-xl border border-brand/20">
                {op.nombre[0]}{op.apellido[0]}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${op.estado === 'activo' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {op.estado}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{op.nombre} {op.apellido}</h3>
            <p className="text-sm font-mono text-dark-muted mb-6">@{op.usuario}</p>

            <div className="flex gap-2 pt-4 border-t border-dark-border">
              <button 
                onClick={() => handleOpenTurnos(op)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-colors font-medium text-sm"
                title="Ver Turnos"
              >
                <CalendarClock className="w-4 h-4" /> Turnos
              </button>
              <button 
                onClick={() => handleOpenModal(op)}
                className="p-2 bg-white/5 hover:bg-white/10 text-dark-muted hover:text-white rounded-xl transition-colors"
                title="Editar Operario"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteOperario(op.id_operario)}
                className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-500 rounded-xl transition-colors"
                title="Eliminar Operario"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {operarios.length === 0 && (
         <div className="text-center py-20 bg-dark-card rounded-2xl border border-dark-border border-dashed">
            <User className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
            <p className="text-dark-muted font-medium">No hay operarios registrados en el sistema.</p>
         </div>
      )}

      {/* MODAL CRUD OPERARIO */}
      {isModalOperarioOpen && (
        <div className="fixed inset-0 bg-dark-bg/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6">
              {editingOperario ? 'Editar Operario' : 'Nuevo Operario'}
            </h3>
            
            <form onSubmit={handleSaveOperario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Nombre</label>
                  <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="input-dark w-full" placeholder="Ej. Juan"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Apellido</label>
                  <input type="text" required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="input-dark w-full" placeholder="Ej. Pérez"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Usuario (Login)</label>
                <input type="text" required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className="input-dark w-full font-mono text-sm" placeholder="jperez123" />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">
                  Contraseña {editingOperario && <span className="text-yellow-500/70 lowercase normal-case font-normal ml-1">(Dejar vacío para mantener)</span>}
                </label>
                <input type="password" required={!editingOperario} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-dark w-full" placeholder="••••••••" minLength="6" />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Estado</label>
                <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="input-dark w-full text-sm">
                  <option value="activo">Activo (Puede operar)</option>
                  <option value="inactivo">Inactivo (Suspendido)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOperarioOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-bold transition-colors">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE TURNOS */}
      {isModalTurnosOpen && operarioSeleccionado && (
        <div className="fixed inset-0 bg-dark-bg/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 max-w-2xl w-full shadow-2xl flex flex-col h-[80vh]">
            
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <CalendarClock className="text-blue-500" />
                    Cronograma de Turnos
                  </h3>
                  <p className="text-dark-muted mt-1 uppercase text-xs font-bold tracking-widest mt-2 bg-white/5 inline-block px-3 py-1 rounded-md">
                     {operarioSeleccionado.nombre} {operarioSeleccionado.apellido}
                  </p>
               </div>
               <button onClick={() => setIsModalTurnosOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-dark-muted hover:text-white transition-colors">
                 <X className="w-5 h-5"/>
               </button>
            </div>

            {/* Formulario Asignar Turno */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
               <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Asignar Nuevo Turno</h4>
               <form onSubmit={handleAddTurno} className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Fecha</label>
                    <input type="date" required value={nuevoTurno.fecha} onChange={e => setNuevoTurno({...nuevoTurno, fecha: e.target.value})} className="input-dark w-full px-3 py-2 text-sm" />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-dark-muted mb-1 ml-1 uppercase tracking-wider">Turno Laboral</label>
                    <select required value={nuevoTurno.id_turno} onChange={e => setNuevoTurno({...nuevoTurno, id_turno: e.target.value})} className="input-dark w-full px-3 py-2 text-sm">
                      {turnosMaestros.map(tm => (
                        <option key={tm.id_turno} value={tm.id_turno}>
                          {tm.nombre_turno} ({tm.hora_inicio.slice(0,5)} a {tm.hora_fin.slice(0,5)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap h-[42px]">
                    Asignar
                  </button>
               </form>
            </div>

            {/* Lista de Turnos */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {loadingTurnos ? (
                 <div className="text-center py-10 text-dark-muted">Cargando turnos...</div>
              ) : turnosAsignados.length === 0 ? (
                 <div className="text-center py-10 border border-dark-border border-dashed rounded-xl bg-white/[0.02]">
                    <Clock className="w-8 h-8 text-dark-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-dark-muted">No hay turnos programados.</p>
                 </div>
              ) : (
                 turnosAsignados.map(asignacion => (
                   <div key={asignacion.id_asignacion} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-center min-w-[80px]">
                            <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest leading-none mb-1">
                              {new Date(asignacion.fecha + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                            </p>
                            <p className="text-xl font-black text-white leading-none">
                              {new Date(asignacion.fecha + 'T00:00:00').getDate()}
                            </p>
                         </div>
                         <div>
                            <div className="flex flex-col mb-1">
                               <span className="font-bold text-blue-400 capitalize">{asignacion.turnos?.nombre_turno}</span>
                               <div className="flex items-center gap-1 text-xs font-mono text-dark-muted">
                                 <Clock className="w-3 h-3" />
                                 {asignacion.turnos?.hora_inicio.slice(0,5)} - {asignacion.turnos?.hora_fin.slice(0,5)}
                               </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-dark-muted">Estado: <span className="text-green-400">{asignacion.estado}</span></span>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTurno(asignacion.id_asignacion)}
                        className="p-2 text-red-500/50 hover:text-red-500 bg-red-500/5 hover:bg-red-500/20 rounded-xl transition-colors"
                        title="Eliminar Asignación"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                 ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
