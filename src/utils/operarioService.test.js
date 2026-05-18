import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOperarios, saveOperario, deleteOperario } from './operarioService';
import { supabase } from '@/lib/supabase';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('operarioService CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('READ: debe obtener la lista de operarios', async () => {
    const mockData = [{ id_operario: 1, nombre: 'Juan' }];
    const selectSpy = vi.fn().mockResolvedValue({ data: mockData, error: null });
    
    supabase.from.mockReturnValue({
      select: () => ({ order: selectSpy })
    });

    const result = await getOperarios();
    expect(result).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('operarios');
  });

  it('CREATE: debe insertar un nuevo operario', async () => {
    const newOp = { nombre: 'Pedro', usuario: 'pedro1', password: '123' };
    const mockResponse = { id_operario: 2, ...newOp };
    const singleSpy = vi.fn().mockResolvedValue({ data: mockResponse, error: null });

    supabase.from.mockReturnValue({
      insert: () => ({ select: () => ({ single: singleSpy }) })
    });

    const result = await saveOperario(newOp);
    expect(result.id_operario).toBe(2);
    expect(result.nombre).toBe('Pedro');
  });

  it('UPDATE: debe actualizar un operario existente', async () => {
    const updateData = { nombre: 'Juan Modificado' };
    const mockResponse = { id_operario: 1, ...updateData };
    const singleSpy = vi.fn().mockResolvedValue({ data: mockResponse, error: null });

    supabase.from.mockReturnValue({
      update: () => ({ eq: () => ({ select: () => ({ single: singleSpy }) }) })
    });

    const result = await saveOperario(updateData, 1);
    expect(result.nombre).toBe('Juan Modificado');
  });

  it('DELETE: debe eliminar un operario', async () => {
    const eqSpy = vi.fn().mockResolvedValue({ error: null });

    supabase.from.mockReturnValue({
      delete: () => ({ eq: eqSpy })
    });

    const result = await deleteOperario(1);
    expect(result).toBe(true);
    expect(eqSpy).toHaveBeenCalledWith('id_operario', 1);
  });
});
