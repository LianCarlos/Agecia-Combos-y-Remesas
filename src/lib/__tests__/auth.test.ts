/**
 * Tests para el middleware de autorización isAdmin
 * Capa 3 — Servicio (sin dependencias externas)
 */

// ─── Setup de variables de entorno ────────────────────────────────
const VALID_TOKEN = "admin-secret-token-123";
const ENV_FALLBACK_TOKEN = "env-fallback-token-456";

beforeEach(() => {
  process.env.ADMIN_API_TOKEN = VALID_TOKEN;
});

afterEach(() => {
  delete process.env.ADMIN_API_TOKEN;
});

// ─── Mocks ────────────────────────────────────────────────────────
const mockHeadersGet = jest.fn();

jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((input: string) => ({
    url: input,
    headers: {
      get: mockHeadersGet,
    },
  })),
}));

// Mock de supabaseAdmin para isAdmin (consulta site_settings)
// Usamos un objeto mutable porque jest.mock es hoisted
const supabaseMock = {
  maybeSingle: jest.fn(),
};

jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: unknown[]) => supabaseMock.maybeSingle(...args),
        }),
      }),
    }),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────
import { isAdmin } from "../auth";
import { NextRequest } from "next/server";

// Helper para crear requests
function createRequest(url: string, authorizationHeader?: string): NextRequest {
  mockHeadersGet.mockReturnValue(authorizationHeader ?? null);
  return new NextRequest(url);
}

describe("isAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto: DB no tiene contraseña → usa fallback del env
    supabaseMock.maybeSingle.mockResolvedValue({ data: { key: "admin_password", value: "" }, error: null });
  });

  // ─── Rechazo ────────────────────────────────────────────────────

  it("rechaza requests sin token (sin header ni query param)", async () => {
    mockHeadersGet.mockReturnValue(null);
    const request = new NextRequest("http://localhost/api/admin/exchange-rates");

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("rechaza token inválido en header Authorization Bearer", async () => {
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates",
      "Bearer wrong-token"
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("rechaza token enviado por query param (solo Bearer header aceptado)", async () => {
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates?token=wrong-token"
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("rechaza header Authorization con esquema incorrecto (no Bearer)", async () => {
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates",
      `Basic ${VALID_TOKEN}`
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("rechaza cuando no hay ADMIN_API_TOKEN configurado", async () => {
    delete process.env.ADMIN_API_TOKEN;

    const request = createRequest(
      "http://localhost/api/admin/exchange-rates",
      `Bearer ${VALID_TOKEN}`
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("rechaza header Authorization sin espacio (formato inválido)", async () => {
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates",
      "BearerInvalidToken"
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  // ─── Aceptación ─────────────────────────────────────────────────

  it("acepta token válido por header Authorization: Bearer", async () => {
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates",
      `Bearer ${VALID_TOKEN}`
    );

    const result = await isAdmin(request);

    expect(result).toBe(true);
  });

  it("rechaza token válido enviado por query param (no se acepta query param)", async () => {
    mockHeadersGet.mockReturnValue(null);
    const request = new NextRequest(
      `http://localhost/api/admin/exchange-rates?token=${VALID_TOKEN}`
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });

  it("acepta token por header aunque query param tenga token inválido", async () => {
    // Solo el Bearer header importa; query param es ignorado
    const request = createRequest(
      "http://localhost/api/admin/exchange-rates?token=wrong-token",
      `Bearer ${VALID_TOKEN}`
    );

    const result = await isAdmin(request);

    expect(result).toBe(true);
  });

  it("rechaza token por query param aunque sea válido si el header no es Bearer", async () => {
    const request = createRequest(
      `http://localhost/api/admin/exchange-rates?token=${VALID_TOKEN}`,
      "Basic some-other-token"
    );

    const result = await isAdmin(request);

    expect(result).toBe(false);
  });
});
