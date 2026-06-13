/**
 * Tests para el servicio payment-methods
 * Capa 3 — Servicio (mockea Supabase client)
 */

import {
  getActivePaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../payment-methods";
import type { PaymentMethod } from "@/types";

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

// Helper: configura la cadena de mocks para select->eq->order
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

describe("getActivePaymentMethods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array de métodos de pago activos", async () => {
    const mockData: PaymentMethod[] = [
      { id: "pm-1", name: "Zelle", is_active: true, created_at: "2026-01-01" },
      { id: "pm-2", name: "Western Union", is_active: true, created_at: "2026-01-01" },
    ];
    setupSelectChain({ data: mockData, error: null });

    const result = await getActivePaymentMethods();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Zelle");
    expect(result[1].name).toBe("Western Union");
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupSelectChain({ data: null, error: { message: "DB Error" } });

    const result = await getActivePaymentMethods();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("getAllPaymentMethods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna todos los métodos de pago (activos e inactivos)", async () => {
    const mockData: PaymentMethod[] = [
      { id: "pm-1", name: "Zelle", is_active: true, created_at: "2026-01-01" },
      { id: "pm-2", name: "Western Union", is_active: false, created_at: "2026-01-01" },
    ];
    setupSelectAllChain({ data: mockData, error: null });

    const result = await getAllPaymentMethods();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("retorna array vacío cuando hay error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    setupSelectAllChain({ data: null, error: { message: "DB Error" } });

    const result = await getAllPaymentMethods();

    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("createPaymentMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("crea un método de pago y lo retorna", async () => {
    const newMethod: PaymentMethod = {
      id: "pm-new",
      name: "PayPal",
      is_active: true,
      created_at: "2026-06-05",
    };
    mockSingle.mockResolvedValue({ data: newMethod, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createPaymentMethod("PayPal");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("PayPal");
    expect(result!.is_active).toBe(true);
  });

  it("retorna null cuando hay error al crear", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Duplicate" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await createPaymentMethod("Duplicado");

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("updatePaymentMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("actualiza un método de pago y lo retorna", async () => {
    const updated: PaymentMethod = {
      id: "pm-1",
      name: "Zelle Actualizado",
      is_active: false,
      created_at: "2026-01-01",
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updatePaymentMethod("pm-1", "Zelle Actualizado", false);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Zelle Actualizado");
    expect(result!.is_active).toBe(false);
  });

  it("retorna null cuando hay error al actualizar", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await updatePaymentMethod("pm-999", "Nope", true);

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("deletePaymentMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("elimina un método de pago y retorna true", async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

    // Necesitamos un mock separado para delete
    const { createClient } = require("@/lib/supabase/server");
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        delete: mockDelete,
      })),
    });

    // Re-import para usar el nuevo mock
    const { deletePaymentMethod: del } = require("../payment-methods");
    const result = await del("pm-1");

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

    const { deletePaymentMethod: del } = require("../payment-methods");
    const result = await del("pm-1");

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });
});
