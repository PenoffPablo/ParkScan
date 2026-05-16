# Reporte Técnico: Desarrollo de Funcionalidades Clave - ParkScan

Este documento detalla los avances técnicos realizados en la segunda etapa del proyecto ParkScan, enfocándose en la robustez del sistema mediante la implementación de autenticación, integración con servicios externos y validaciones de datos.

---

## 1. Sistema de Autenticación y Control de Acceso

Se ha implementado un sistema de autenticación personalizado que separa los roles de **Administrador** y **Operario**, garantizando que cada usuario acceda únicamente a las funcionalidades correspondientes.

### Características Principales:
- **Gestión de Identidades**: Utiliza tablas personalizadas en Supabase (`administradores` y `operarios`) para el almacenamiento de credenciales.
- **Validación de Credenciales**: El proceso de inicio de sesión verifica la existencia del usuario y la coincidencia de la contraseña directamente contra la base de datos.
- **Persistencia de Sesión**: Se utiliza `localStorage` para mantener el estado de la sesión en el navegador (`parkscan_admin` o `parkscan_operario`).
- **Control de Acceso (RBAC)**: Dependiendo del rol detectado, el sistema redirige al usuario a su dashboard específico (`/admin/dashboard` o `/operario/dashboard`).

### Evidencia de Implementación (Login.jsx):
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const tabla = role === 'admin' ? 'administradores' : 'operarios';
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('usuario', usuario)
      .eq('password', password) // Validación de credenciales
      .single();

    if (error || !data) throw new Error('Credenciales incorrectas');

    // Guardar sesión y redirigir
    localStorage.setItem(`parkscan_${role}`, JSON.stringify(data));
    navigate(role === 'admin' ? '/admin/dashboard' : '/operario/dashboard');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 2. Integración con API Externa: Mercado Pago

El sistema permite a los clientes abonar su estadía de forma autónoma mediante la integración con la API de **Mercado Pago**.

### Flujo de Integración:
1. **Consumo de Datos**: El sistema identifica el ticket mediante un código alfanumérico o QR.
2. **Cálculo de Estadía**: Se calcula el monto a pagar en base al tiempo transcurrido.
3. **Generación de Preferencia**: Se invoca una **Supabase Edge Function** (`create-preference`) que actúa como puente seguro con la API de Mercado Pago para generar un `init_point` (URL de pago).
4. **Respuesta en Tiempo Real**: El sistema queda a la escucha mediante **Supabase Realtime** para detectar cuando el pago es procesado y liberar la plaza automáticamente.

### Evidencia de Consumo de API (Pago.jsx):
```javascript
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

    if (data.init_point) {
      setPreferenceId(data.id);
      setInitPoint(data.init_point); // URL retornada por la API de Mercado Pago
    }
  } catch (error) {
    console.error('Error al comunicarse con Mercado Pago:', error.message);
  }
};
```

---

## 3. Validaciones de Datos

Para asegurar la integridad de la información y mejorar la experiencia del usuario, se han implementado múltiples capas de validación en todos los formularios críticos del sistema.

### Validaciones Implementadas:
- **Campos Obligatorios**: Uso de atributos `required` en HTML5 y verificaciones manuales antes de enviar datos al servidor.
- **Formatos y Longitudes**: Validación de longitud mínima de contraseñas (`minLength="6"`) y formatos específicos para nombres de usuario.
- **Lógica de Negocio**:
  - En la **Gestión de Turnos**, se valida que la fecha de fin no sea anterior a la de inicio.
  - En el **Portal de Pagos**, se valida que el ticket exista y no haya sido pagado previamente.
- **Tratamiento de Errores**: Feedback inmediato al usuario mediante alertas y mensajes de error estilizados para prevenir el envío de datos inválidos.

### Ejemplo de Validación Lógica (Operarios.jsx):
```javascript
const handleAddTurno = async (e) => {
  e.preventDefault();
  if(!nuevoTurno.id_turno) return alert("Selecciona un turno");
  if(!nuevoTurno.fechaInicio || !nuevoTurno.fechaFin) return alert("Selecciona un rango de fechas");

  const inicio = new Date(nuevoTurno.fechaInicio);
  const fin = new Date(nuevoTurno.fechaFin);
  
  if (fin < inicio) {
    return alert("La fecha final no puede ser anterior a la inicial."); // Validación de coherencia temporal
  }
  // ... proceder con la inserción
};
```

---

## Conclusión

El sistema ParkScan ha evolucionado de un prototipo básico a una aplicación funcional y segura. La incorporación de un sistema de roles, el procesamiento de pagos electrónicos y la rigurosidad en la captura de datos sientan las bases para un despliegue exitoso en un entorno real.
