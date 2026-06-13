/**
 * Tests para el servicio delivery-methods
 * Capa 3 — Servicio (mockea Supabase client)
 */

import {
  getActiveDeliveryMethods,
  getAllDeliveryMethods,
  createDeliveryMethod,
  updateDeliveryMethod,
  deleteDeliveryMethod,
} from "../delivery-methods";
import type { DeliveryMethod } from "@/types";

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
        delete: jest.fn(() => ({ eq: jest.fn() })),
      })),
    })
  ),
}));

function setupSelectChain(result: { data: unknown; error: unknown }) {
  mockSelect.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: mockOrder,
    }),
  });
  mockOrder.mockResolvedValue(result);
}

function setupSelectAllChain(result: { data: unknown; error: unknown }) {
  mockSelect.mockReturnValue({
    order: mockOrder,
  });
  mockOrder.mockResolvedValue(result);
}

describe("getActiveDeliveryMethods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array de métodos de entrega activos", async () => {
    const mockData: DeliveryMethod[] = [
      { id: "dm-1", name: "Efectivo USD", is_active: true, created_at: "2026-01-01" },
      { id: "dm-2", name: "Transferencia Bancaria", is_active: true, created_at: "2026-01-01" },
    ];
    setupSelectChain({ data: mockData, error: null });

    const result = await getActiveDeliveryMethods();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Efectivo USD");
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupSelectChain({ data: null, error: { message: "DB Error" } });

    const result = await getActiveDeliveryMethods();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("getAllDeliveryMethods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna todos los métodos de entrega", async () => {
    const mockData: DeliveryMethod[] = [
      { id: "dm-1", name: "Efectivo USD", is_active: true, created_at: "2026-01-01" },
      { id: "dm-2", name: "Transferencia Bancaria", is_active: false, created_at: "2026-01-01" },
    ];
    setupSelectAllChain({ data: mockData, error: null });

    const result = await getAllDeliveryMethods();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupSelectAllChain({ data: null, error: { message: "DB Error" } });

    const result = await getAllDeliveryMethods();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("createDeliveryMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("crea un método de entrega y lo retorna", async () => {
    const newMethod: DeliveryMethod = {
      id: "dm-new",
      name: "MLC",
      is_active: true,
      created_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newMethod, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createDeliveryMethod("MLC");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("MLC");
    expect(result!.is_active).toBe(true);
  });

  it("retorna null cuando hay error al crear", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Duplicate" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createDeliveryMethod("Duplicado");

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("updateDeliveryMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("actualiza un método de entrega y lo retorna", async () => {
    const updated: DeliveryMethod = {
      id: "dm-1",
      name: "Efectivo USD Actualizado",
      is_active: false,
      created_at: "2026-01-01",
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateDeliveryMethod("dm-1", "Efectivo USD Actualizado", false);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Efectivo USD Actualizado");
    expect(result!.is_active).toBe(false);
  });

  it("retorna null cuando hay error al actualizar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updateDeliveryMethod("dm-999", "Nope", true);

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("deleteDeliveryMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("elimina un método de entrega y retorna true", async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        delete: mockDelete,
      })),
    });

    const { deleteDeliveryMethod: del } = require("../delivery-methods");
    const result = await del("dm-1");

    expect(result).toBe(true);
  });

  it("retorna false cuando hay error al eliminar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: { message: "FK constraint" } });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        delete: mockDelete,
      })),
    });

    const { deleteDeliveryMethod: del } = require("../delivery-methods");
    const result = await del("dm-1");

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });
});
