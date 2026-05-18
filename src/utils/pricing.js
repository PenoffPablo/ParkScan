/**
 * Calcula el costo de estacionamiento basado en la hora de entrada y salida.
 * Se cobra un mínimo de 1 hora. Cualquier fracción de hora adicional se redondea hacia arriba.
 * 
 * @param {Date|string} entrada - Fecha y hora de ingreso.
 * @param {Date|string} salida - Fecha y hora de egreso.
 * @param {number} costoPorHora - Tarifa horaria en la moneda del sistema.
 * @returns {object} - Objeto con horasCalculadas y montoTotal.
 */
export function calculateParkingCost(entrada, salida, costoPorHora) {
  const dEntrada = new Date(entrada);
  const dSalida = new Date(salida);
  
  if (isNaN(dEntrada.getTime()) || isNaN(dSalida.getTime())) {
    throw new Error("Fechas de entrada o salida inválidas");
  }

  const diffMs = dSalida - dEntrada;
  
  // Si la salida es anterior a la entrada (error de datos), devolvemos 0 o tiramos error
  if (diffMs < 0) {
    return { horasCalculadas: 0, montoTotal: 0 };
  }

  // Convertir ms a horas y redondear hacia arriba (ej: 1h 5m -> 2h)
  // Mínimo 1 hora cobrada.
  const msPorHora = 1000 * 60 * 60;
  const horasCalculadas = Math.max(1, Math.ceil(diffMs / msPorHora));
  const montoTotal = horasCalculadas * costoPorHora;

  return {
    horasCalculadas,
    montoTotal
  };
}
