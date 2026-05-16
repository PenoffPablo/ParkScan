import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sectorService } from './sectorService';
import { supabase } from '@/lib/supabase';

// Mockeamos el cliente de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Pruebas Unitarias - CRUD Sectores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería obtener sectores correctamente (READ)', async () => {
    const mockSectores = [{ id_sector: 1, nombre: 'A', capacidad: 10 }];
    
    // Configuramos el mock de Supabase
    const selectMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({ data: mockSectores, error: null });
    
    supabase.from.mockReturnValue({
      select: selectMock,
      order: orderMock
    });

    const resultado = await sectorService.obtenerSectores();
    
    expect(supabase.from).toHaveBeenCalledWith('sectores');
    expect(resultado).toEqual(mockSectores);
  });

  it('debería crear un sector y sus plazas (CREATE)', async () => {
    const nuevoSector = { id_sector: 2, nombre: 'B', capacidad: 5 };
    
    // Mock para insertar sector
    const insertSectorMock = vi.fn().mockReturnThis();
    const selectSectorMock = vi.fn().mockReturnThis();
    const singleSectorMock = vi.fn().mockResolvedValue({ data: nuevoSector, error: null });

    // Mock para insertar plazas
    const insertPlazasMock = vi.fn().mockResolvedValue({ error: null });

    supabase.from.mockImplementation((table) => {
      if (table === 'sectores') {
        return { insert: insertSectorMock, select: selectSectorMock, single: singleSectorMock };
      }
      if (table === 'plazas') {
        return { insert: insertPlazasMock };
      }
    });

    const resultado = await sectorService.crearSector('B', 5);

    expect(supabase.from).toHaveBeenCalledWith('sectores');
    expect(insertSectorMock).toHaveBeenCalledWith([{ nombre: 'B', capacidad: 5 }]);
    expect(supabase.from).toHaveBeenCalledWith('plazas');
    expect(insertPlazasMock).toHaveBeenCalled();
    // Verifica que se generaron 5 plazas
    const llamadasPlazas = insertPlazasMock.mock.calls[0][0];
    expect(llamadasPlazas).toHaveLength(5);
    expect(llamadasPlazas[0].numero).toBe('B1');
    expect(llamadasPlazas[4].numero).toBe('B5');
    
    expect(resultado).toEqual(nuevoSector);
  });

  it('debería actualizar el estado de un sector (UPDATE)', async () => {
    const sectorModificado = { id_sector: 1, nombre: 'A', estado: 'mantenimiento' };
    
    const updateMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({ data: sectorModificado, error: null });

    supabase.from.mockReturnValue({
      update: updateMock,
      eq: eqMock,
      select: selectMock,
      single: singleMock,
    });

    const resultado = await sectorService.cambiarEstadoSector(1, 'disponible');

    expect(updateMock).toHaveBeenCalledWith({ estado: 'mantenimiento' });
    expect(eqMock).toHaveBeenCalledWith('id_sector', 1);
    expect(resultado.estado).toBe('mantenimiento');
  });

  it('debería eliminar un sector (DELETE)', async () => {
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({ data: { id_sector: 1 }, error: null });

    supabase.from.mockReturnValue({
      delete: deleteMock,
      eq: eqMock,
      select: selectMock,
      single: singleMock,
    });

    await sectorService.eliminarSector(1);

    expect(supabase.from).toHaveBeenCalledWith('sectores');
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id_sector', 1);
  });
});
