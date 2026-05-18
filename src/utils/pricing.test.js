import { describe, it, expect } from 'vitest';
import { calculateParkingCost } from './pricing';

describe('calculateParkingCost', () => {
  const HOURLY_RATE = 1000;

  it('debe cobrar el mínimo de 1 hora para estadías cortas (ej: 10 min)', () => {
    const entry = new Date('2026-04-06T10:00:00');
    const exit = new Date('2026-04-06T10:10:00');
    const result = calculateParkingCost(entry, exit, HOURLY_RATE);
    
    expect(result.horasCalculadas).toBe(1);
    expect(result.montoTotal).toBe(1000);
  });

  it('debe cobrar exactamente 2 horas para estadías de 120 min', () => {
    const entry = new Date('2026-04-06T10:00:00');
    const exit = new Date('2026-04-06T12:00:00');
    const result = calculateParkingCost(entry, exit, HOURLY_RATE);
    
    expect(result.horasCalculadas).toBe(2);
    expect(result.montoTotal).toBe(2000);
  });

  it('debe redondear hacia arriba para fracciones de hora (ej: 1h 1min -> 2h)', () => {
    const entry = new Date('2026-04-06T10:00:00');
    const exit = new Date('2026-04-06T11:01:00');
    const result = calculateParkingCost(entry, exit, HOURLY_RATE);
    
    expect(result.horasCalculadas).toBe(2);
    expect(result.montoTotal).toBe(2000);
  });

  it('debe manejar estadías de varios días correctamente', () => {
    const entry = new Date('2026-04-06T10:00:00');
    const exit = new Date('2026-04-07T10:00:00'); // 24 horas exactas
    const result = calculateParkingCost(entry, exit, HOURLY_RATE);
    
    expect(result.horasCalculadas).toBe(24);
    expect(result.montoTotal).toBe(24000);
  });

  it('debe devolver 0 si la salida es previa a la entrada', () => {
    const entry = new Date('2026-04-06T12:00:00');
    const exit = new Date('2026-04-06T10:00:00');
    const result = calculateParkingCost(entry, exit, HOURLY_RATE);
    
    expect(result.horasCalculadas).toBe(0);
    expect(result.montoTotal).toBe(0);
  });

  it('debe lanzar error si las fechas son inválidas', () => {
    expect(() => calculateParkingCost('fecha-rara', new Date(), HOURLY_RATE)).toThrow("Fechas de entrada o salida inválidas");
  });
});
