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
  title: "Combo Familiar",
  description: "Paquete para toda la familia",
  price_usd: 49.99,
  image_url: "https://example.com/img.jpg",
  available: true,
  created_at: "2026-01-01",
  updated_at: "2026-06-01",
};

describe("getActiveCombos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array de combos disponibles (available=true)", async () => {
    const mockData: Combo[] = [
      mockCombo,
      {
        id: "combo-2",
        title: "Combo Individual",
        description: null,
        price_usd: 29.99,
        image_url: null,
        available: true,
        created_at: "2026-01-01",
        updated_at: "2026-06-01",
      },
    ];
    setupActiveChain({ data: mockData, error: null });

    const result = await getActiveCombos();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Combo Familiar");
    expect(result[0].price_usd).toBe(49.99);
    expect(result[0].available).toBe(true);
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
        title: "Combo Antiguo",
        description: null,
        price_usd: 19.99,
        image_url: null,
        available: false,
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

  it("crea un combo y lo retorna con campos en inglés", async () => {
    const newCombo: Combo = {
      id: "combo-new",
      title: "Nuevo Combo",
      description: "Descripción del combo",
      price_usd: 39.99,
      image_url: null,
      available: true,
      created_at: "2026-06-05",
      updated_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newCombo, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({
      title: "Nuevo Combo",
      description: "Descripción del combo",
      price_usd: 39.99,
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Nuevo Combo");
    expect(result!.price_usd).toBe(39.99);
    expect(result!.available).toBe(true);
  });

  it("crea un combo sin descripción ni imagen", async () => {
    const newCombo: Combo = {
      id: "combo-min",
      title: "Combo Mínimo",
      description: null,
      price_usd: 9.99,
      image_url: null,
      available: true,
      created_at: "2026-06-05",
      updated_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newCombo, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({
      title: "Combo Mínimo",
      price_usd: 9.99,
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Combo Mínimo");
    expect(result!.description).toBeNull();
    expect(result!.image_url).toBeNull();
  });

  it("retorna null cuando hay error al crear", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Error" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createCombo({ title: "Fallo", price_usd: 0 });

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
      title: "Combo Actualizado",
      price_usd: 59.99,
      available: false,
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateCombo("combo-1", {
      title: "Combo Actualizado",
      price_usd: 59.99,
      available: false,
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Combo Actualizado");
    expect(result!.price_usd).toBe(59.99);
    expect(result!.available).toBe(false);
  });

  it("retorna null cuando hay error al actualizar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateCombo("combo-999", { title: "Nope" });

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
