/**
 * @jest-environment node
 *
 * `createOrder` vive en `@/lib/actions/orders`, que importa `next/cache`
 * (revalidatePath). Esa cadena de módulos de servidor de Next.js necesita los
 * globals nativos de Node (Request, Response, fetch, TextEncoder…), que el
 * entorno `jsdom` de Jest no expone. Aquí se usa `node` por eso.
 */

// ─── Mocks de las dependencias de la Server Action createOrder ─────────────
// createOrder lee la cookie `mr_ref`, resuelve el referido y delega en
// insertOrder. Aquí aislados para probar SOLO la resolución del referido.

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/services/referrers", () => ({
  REFERRAL_COOKIE: "mr_ref",
  resolveByCode: jest.fn(),
}));

jest.mock("@/lib/services/orders", () => ({
  insertOrder: jest.fn(),
}));

import { createOrder } from "@/lib/actions/orders";
import { cookies } from "next/headers";
import { resolveByCode } from "@/lib/services/referrers";
import { insertOrder } from "@/lib/services/orders";
import type { CreateOrderInput } from "@/types";

const mockCookies = cookies as jest.Mock;
const mockResolveByCode = resolveByCode as jest.Mock;
const mockInsertOrder = insertOrder as jest.Mock;

describe("createOrder (acción pública)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resuelve el referido desde la cookie y lo pasa a insertOrder", async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "maria123" })),
    });
    mockResolveByCode.mockResolvedValue({
      id: "r1",
      full_name: "María Pérez",
      referral_code: "maria123",
      is_active: true,
    });
    mockInsertOrder.mockResolvedValue({ id: "o1" });

    const input: CreateOrderInput = { order_type: "cart", amount_usd: 10 };
    const result = await createOrder(input);

    expect(result).toEqual({ success: true, orderId: "o1", referrerResolved: true });
    expect(mockResolveByCode).toHaveBeenCalledWith("maria123");
    expect(mockInsertOrder).toHaveBeenCalledWith(input, {
      referrer_id: "r1",
      referral_code: "maria123",
    });
  });

  it("sin cookie no resuelve referido y llama a insertOrder con null", async () => {
    mockCookies.mockResolvedValue({ get: jest.fn(() => undefined) });
    mockInsertOrder.mockResolvedValue({ id: "o2" });

    const input: CreateOrderInput = { order_type: "recharge", amount_usd: 5 };
    const result = await createOrder(input);

    expect(result).toEqual({ success: true, orderId: "o2", referrerResolved: false });
    expect(mockResolveByCode).not.toHaveBeenCalled();
    expect(mockInsertOrder).toHaveBeenCalledWith(input, {
      referrer_id: null,
      referral_code: null,
    });
  });

  it("cookie con código inexistente: pedido sin atribución", async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: "nadie" })),
    });
    mockResolveByCode.mockResolvedValue(null);
    mockInsertOrder.mockResolvedValue({ id: "o3" });

    const input: CreateOrderInput = { order_type: "cart", amount_usd: 12 };
    const result = await createOrder(input);

    expect(result).toEqual({ success: true, orderId: "o3", referrerResolved: false });
    expect(mockInsertOrder).toHaveBeenCalledWith(input, {
      referrer_id: null,
      referral_code: null,
    });
  });

  it("order_type inválido: retorna success false sin insertar", async () => {
    const input = { order_type: "invalid" } as unknown as CreateOrderInput;
    const result = await createOrder(input);

    expect(result).toEqual({ success: false });
    expect(mockInsertOrder).not.toHaveBeenCalled();
  });

  it("fallo de inserción: retorna success false", async () => {
    mockCookies.mockResolvedValue({ get: jest.fn(() => undefined) });
    mockInsertOrder.mockResolvedValue(null);

    const result = await createOrder({ order_type: "combo", amount_usd: 8 });

    expect(result).toEqual({ success: false });
  });
});
