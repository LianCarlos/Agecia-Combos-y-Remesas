// ─── Mock del cliente Supabase admin (service role) ─────────────────────
jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  },
}));

// ─── Mock del cliente Supabase server (otros métodos del servicio) ──────
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({ from: jest.fn() })),
}));

import { resolveByCode, REFERRAL_COOKIE } from "../referrers";

function mockResolve(data: unknown, error: unknown = null) {
  const { supabaseAdmin } = require("@/lib/supabase/admin");
  const selectChain = {
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  supabaseAdmin.from.mockReturnValue({
    select: jest.fn(() => selectChain),
  });
  return selectChain;
}

describe("resolveByCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resuelve un código activo y normaliza a minúsculas", async () => {
    const chain = mockResolve({
      id: "r1",
      full_name: "María Pérez",
      referral_code: "maria123",
      is_active: true,
    });

    const referrer = await resolveByCode("  Maria123  ");

    expect(referrer?.id).toBe("r1");
    expect(chain.eq).toHaveBeenCalledWith("referral_code", "maria123");
    expect(chain.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("retorna null para un código inexistente", async () => {
    mockResolve(null);

    const referrer = await resolveByCode("nadie");

    expect(referrer).toBeNull();
  });

  it("retorna null cuando Supabase devuelve error", async () => {
    mockResolve(null, { message: "connection error" });

    const referrer = await resolveByCode("maria123");

    expect(referrer).toBeNull();
  });
});

describe("REFERRAL_COOKIE", () => {
  it("usa el nombre de cookie esperado", () => {
    expect(REFERRAL_COOKIE).toBe("mr_ref");
  });
});
