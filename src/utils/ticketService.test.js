import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generarTicketPublico } from './ticketService';
import { supabase } from '@/lib/supabase';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('generarTicketPublico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe generar un ticket exitosamente cuando hay plazas disponibles', async () => {
    // Mock de respuesta para buscar plazas
    const mockPlaza = { id_plaza: 1, numero: 'A-101', sectores: { id_sector: 1, nombre: 'A', estado: 'disponible' } };
    
    // Configurar el mock para que la primera llamada a .from('plazas').select(...) devuelva la plaza
    const selectSpy = vi.fn().mockResolvedValue({ data: [mockPlaza], error: null });
    const updateSpy = vi.fn().mockResolvedValue({ error: null });
    const singleSpy = vi.fn().mockResolvedValue({ data: { id_ticket: 1, id_plaza: 1, codigo_qr: 'QR-TEST' }, error: null });

    supabase.from.mockImplementation((table) => {
      if (table === 'plazas') {
        const query = {
          limit: selectSpy,
          eq: vi.fn(() => query),
          select: () => query,
          update: () => ({ eq: updateSpy }),
        };
        return query;
      }
      if (table === 'tickets') {
        return {
          insert: () => ({ select: () => ({ single: singleSpy }) }),
        };
      }
    });

    const result = await generarTicketPublico();

    expect(result.success).toBe(true);
    expect(result.ticket.id_ticket).toBe(1);
    expect(updateSpy).toHaveBeenCalled(); // Marcar ocupada
  });

  it('debe fallar si no hay plazas disponibles', async () => {
    const selectSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    
    supabase.from.mockImplementation(() => {
      const query = {
        limit: selectSpy,
        eq: vi.fn(() => query),
        select: () => query,
      };
      return query;
    });

    const result = await generarTicketPublico();

    expect(result.success).toBe(false);
    expect(result.error).toBe("No hay plazas disponibles");
  });

  it('debe realizar rollback (revertir plaza a libre) si la creación del ticket falla', async () => {
    const mockPlaza = { id_plaza: 1, numero: 'A-101' };
    
    const selectSpy = vi.fn().mockResolvedValue({ data: [mockPlaza], error: null });
    const updateOccupiedSpy = vi.fn().mockResolvedValue({ error: null });
    const updateFreeSpy = vi.fn().mockResolvedValue({ error: null });
    
    // Mock fallido para tickets
    const singleSpy = vi.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });

    supabase.from.mockImplementation((table) => {
      if (table === 'plazas') {
        const query = {
          limit: selectSpy,
          eq: vi.fn(() => query),
          select: () => query,
          update: (data) => {
             if (data.estado === 'ocupada') return { eq: updateOccupiedSpy };
             if (data.estado === 'libre') return { eq: updateFreeSpy };
          },
        };
        return query;
      }
      if (table === 'tickets') {
        return {
          insert: () => ({ select: () => ({ single: singleSpy }) }),
        };
      }
    });

    const result = await generarTicketPublico();

    expect(result.success).toBe(false);
    expect(updateOccupiedSpy).toHaveBeenCalled();
    expect(updateFreeSpy).toHaveBeenCalled(); // Se revertió el estado
  });
});

