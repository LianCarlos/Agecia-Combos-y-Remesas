/**
 * Tests para el servicio combos
 * Capa 3 — Servicio (mockea Supabase client)
 */

import {
  getActiveCombos,
  getAllCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from "../combos";
import type { Combo } from "@/types";

// ─── Mock del cliente Supabase server ─────────────────────────────
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: mockSelect,
        insert: jest.fn(() => ({ select: mockSelect })),
        update: jest.fn(() => ({ eq: jest.fn(() => ({ select: mockSelect })) })),
      })),
    })
  ),
}));

function setupActiveChain(result: { data: unknown; error: unknown }) {
  mockSelect.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: mockOrder,
    }),
  });
  mockOrder.mockResolvedValue(result);
}

function setupAllChain(result: { data: unknown; error: unknown }) {
  mockSelect.mockReturnValue({
    order: mockOrder,
  });
  mockOrder.mockResolvedValue(result);
}

const mockCombo: Combo = {
  id: "combo-1",
  titulo: "Combo Familiar",
  descripcion: "Paquete para toda la familia",
  precio_usd: 49.99,
  imagen_url: "https://example.com/img.jpg",
  disponible: true,
  created_at: "2026-01-01",
  updated_at: "2026-06-01",
};

describe("getActiveCombos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array de combos disponibles (disponible=true)", async () => {
    const mockData: Combo[] = [
      mockCombo,
      {
        id: "combo-2",
        titulo: "Combo Individual",
        descripcion: null,
        precio_usd: 29.99,
        imagen_url: null,
        disponible: true,
        created_at: "2026-01-01",
        updated_at: "2026-06-01",
      },
    ];
    setupActiveChain({ data: mockData, error: null });

    const result = await getActiveCombos();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].titulo).toBe("Combo Familiar");
    expect(result[0].precio_usd).toBe(49.99);
    expect(result[0].disponible).toBe(true);
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupActiveChain({ data: null, error: { message: "DB Error" } });

    const result = await getActiveCombos();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("getAllCombos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna todos los combos (disponibles y no disponibles)", async () => {
    const mockData: Combo[] = [
      mockCombo,
      {
        id: "combo-3",
        titulo: "Combo Antiguo",
        descripcion: null,
        precio_usd: 19.99,
        imagen_url: null,
        disponible: false,
        created_at: "2025-01-01",
        updated_at: "2025-06-01",
      },
    ];
    setupAllChain({ data: mockData, error: null });

    const result = await getAllCombos();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupAllChain({ data: null, error: { message: "DB Error" } });

    const result = await getAllCombos();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("createCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("crea un combo y lo retorna con campos en español", async () => {
    const newCombo: Combo = {
      id: "combo-new",
      titulo: "Nuevo Combo",
      descripcion: "Descripción del combo",
      precio_usd: 39.99,
      imagen_url: null,
      disponible: true,
      created_at: "2026-06-05",
      updated_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newCombo, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({
      titulo: "Nuevo Combo",
      descripcion: "Descripción del combo",
      precio_usd: 39.99,
    });

    expect(result).not.toBeNull();
    expect(result!.titulo).toBe("Nuevo Combo");
    expect(result!.precio_usd).toBe(39.99);
    expect(result!.disponible).toBe(true);
  });

  it("crea un combo sin descripción ni imagen", async () => {
    const newCombo: Combo = {
      id: "combo-min",
      titulo: "Combo Mínimo",
      descripcion: null,
      precio_usd: 9.99,
      imagen_url: null,
      disponible: true,
      created_at: "2026-06-05",
      updated_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newCombo, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({
      titulo: "Combo Mínimo",
      precio_usd: 9.99,
    });

    expect(result).not.toBeNull();
    expect(result!.titulo).toBe("Combo Mínimo");
    expect(result!.descripcion).toBeNull();
    expect(result!.imagen_url).toBeNull();
  });

  it("retorna null cuando hay error al crear", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Error" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({ titulo: "Fallo", precio_usd: 0 });

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("updateCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("actualiza un combo y lo retorna", async () => {
    const updated: Combo = {
      ...mockCombo,
      titulo: "Combo Actualizado",
      precio_usd: 59.99,
      disponible: false,
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateCombo("combo-1", {
      titulo: "Combo Actualizado",
      precio_usd: 59.99,
      disponible: false,
    });

    expect(result).not.toBeNull();
    expect(result!.titulo).toBe("Combo Actualizado");
    expect(result!.precio_usd).toBe(59.99);
    expect(result!.disponible).toBe(false);
  });

  it("retorna null cuando hay error al actualizar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateCombo("combo-999", { titulo: "Nope" });

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("deleteCombo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("elimina un combo y retorna true", async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        delete: mockDelete,
      })),
    });

    const { deleteCombo: del } = require("../combos");
    const result = await del("combo-1");

    expect(result).toBe(true);
  });

  it("retorna false cuando hay error al eliminar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: { message: "Error" } });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        delete: mockDelete,
      })),
    });

    const { deleteCombo: del } = require("../combos");
    const result = await del("combo-1");

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });
});
