/**
 * Tests de integración para API Routes
 *
 * Cada test mockea el servicio correspondiente y verifica
 * el status code y la estructura de la respuesta.
 *
 * @jest-environment node
 */

// ─── Mocks de servicios ───────────────────────────────────────────
jest.mock("@/lib/services/countries", () => ({
  getActiveCountries: jest.fn(),
}));

jest.mock("@/lib/services/payment-methods", () => ({
  getActivePaymentMethods: jest.fn(),
}));

jest.mock("@/lib/services/delivery-methods", () => ({
  getActiveDeliveryMethods: jest.fn(),
}));

jest.mock("@/lib/services/exchange-rates", () => ({
  getExchangeRates: jest.fn(),
  calculateReceivingAmount: jest.fn(),
}));

jest.mock("@/lib/services/combos", () => ({
  getActiveCombos: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// ─── Imports después de los mocks ─────────────────────────────────
import { GET as getCountries } from "../countries/route";
import { GET as getPaymentMethods } from "../payment-methods/route";
import { GET as getDeliveryMethods } from "../delivery-methods/route";
import { GET as getExchangeRatesRoute } from "../exchange-rates/route";
import { GET as getCombos } from "../combos/route";
import { getActiveCountries } from "@/lib/services/countries";
import { getActivePaymentMethods } from "@/lib/services/payment-methods";
import { getActiveDeliveryMethods } from "@/lib/services/delivery-methods";
import { getExchangeRates, calculateReceivingAmount } from "@/lib/services/exchange-rates";
import { getActiveCombos } from "@/lib/services/combos";

const mockGetActiveCountries = getActiveCountries as jest.Mock;
const mockGetActivePaymentMethods = getActivePaymentMethods as jest.Mock;
const mockGetActiveDeliveryMethods = getActiveDeliveryMethods as jest.Mock;
const mockGetExchangeRates = getExchangeRates as jest.Mock;
const mockCalculateReceivingAmount = calculateReceivingAmount as jest.Mock;
const mockGetActiveCombos = getActiveCombos as jest.Mock;

describe("API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /api/countries ─────────────────────────────────────────
  describe("GET /api/countries", () => {
    it("retorna 200 con array de países (strings)", async () => {
      const mockCountries = ["Estados Unidos", "España", "México"];
      mockGetActiveCountries.mockResolvedValue(mockCountries);

      const response = await getCountries();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0]).toBe("Estados Unidos");
    });

    it("retorna 500 cuando el servicio lanza error", async () => {
      mockGetActiveCountries.mockRejectedValue(new Error("DB Error"));

      const response = await getCountries();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });

  // ─── GET /api/payment-methods ───────────────────────────────────
  describe("GET /api/payment-methods", () => {
    it("retorna 200 con métodos de pago", async () => {
      const mockMethods = [
        { id: "pm-1", name: "Zelle", is_active: true, created_at: "2026-01-01" },
        { id: "pm-2", name: "Western Union", is_active: true, created_at: "2026-01-01" },
      ];
      mockGetActivePaymentMethods.mockResolvedValue(mockMethods);

      const response = await getPaymentMethods();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("Zelle");
    });

    it("retorna 500 cuando el servicio lanza error", async () => {
      mockGetActivePaymentMethods.mockRejectedValue(new Error("DB Error"));

      const response = await getPaymentMethods();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });

  // ─── GET /api/delivery-methods ──────────────────────────────────
  describe("GET /api/delivery-methods", () => {
    it("retorna 200 con métodos de entrega", async () => {
      const mockMethods = [
        { id: "dm-1", name: "Efectivo USD", is_active: true, created_at: "2026-01-01" },
        { id: "dm-2", name: "Transferencia Bancaria", is_active: true, created_at: "2026-01-01" },
      ];
      mockGetActiveDeliveryMethods.mockResolvedValue(mockMethods);

      const response = await getDeliveryMethods();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it("retorna 500 cuando el servicio lanza error", async () => {
      mockGetActiveDeliveryMethods.mockRejectedValue(new Error("DB Error"));

      const response = await getDeliveryMethods();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });

  // ─── GET /api/exchange-rates ────────────────────────────────────
  describe("GET /api/exchange-rates", () => {
    it("retorna 200 con todas las tasas de cambio", async () => {
      const mockRates = [
        {
          id: "rate-1",
          originCountry: "Estados Unidos",
          originCurrency: "USD",
          paymentMethod: "Zelle",
          deliveryMethod: "Efectivo USD",
          rateMultiplier: 97.5,
          updatedAt: "2026-06-02T14:30:00Z",
        },
      ];
      mockGetExchangeRates.mockResolvedValue(mockRates);

      const request = new Request("http://localhost/api/exchange-rates");
      const response = await getExchangeRatesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
    });

    it("retorna resultado de cálculo cuando se pasan todos los parámetros", async () => {
      mockCalculateReceivingAmount.mockResolvedValue({
        rate: 97.5,
        receivingAmount: 48750,
        paymentMethodName: "Zelle",
        deliveryMethodName: "Efectivo USD",
      });

      const request = new Request(
        "http://localhost/api/exchange-rates?paymentMethodId=pm-1&deliveryMethodId=dm-1&amount=500"
      );
      const response = await getExchangeRatesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("rate", 97.5);
      expect(data).toHaveProperty("receivingAmount", 48750);
      expect(data).toHaveProperty("paymentMethodName", "Zelle");
      expect(data).toHaveProperty("deliveryMethodName", "Efectivo USD");
    });

    it("retorna 400 cuando el monto no es válido", async () => {
      const request = new Request(
        "http://localhost/api/exchange-rates?originCountry=US&originCurrency=USD&paymentMethodId=pm-1&deliveryMethodId=dm-1&amount=abc"
      );
      const response = await getExchangeRatesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("retorna 404 cuando no hay tasa para la combinación", async () => {
      mockCalculateReceivingAmount.mockResolvedValue(null);

      const request = new Request(
        "http://localhost/api/exchange-rates?originCountry=Cuba&originCurrency=USD&paymentMethodId=pm-1&deliveryMethodId=dm-999&amount=500"
      );
      const response = await getExchangeRatesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error");
    });

    it("retorna 500 cuando el servicio de tasas lanza error", async () => {
      mockGetExchangeRates.mockRejectedValue(new Error("DB Error"));

      const request = new Request("http://localhost/api/exchange-rates");
      const response = await getExchangeRatesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });

  // ─── GET /api/combos ────────────────────────────────────────────
  describe("GET /api/combos", () => {
    it("retorna 200 con array de combos (campos en español)", async () => {
      const mockCombos = [
        {
          id: "combo-1",
          titulo: "Combo Familiar",
          descripcion: "Paquete familiar",
          precio_usd: 49.99,
          imagen_url: null,
          disponible: true,
          created_at: "2026-01-01",
          updated_at: "2026-06-01",
        },
      ];
      mockGetActiveCombos.mockResolvedValue(mockCombos);

      const response = await getCombos();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].titulo).toBe("Combo Familiar");
      expect(data[0].precio_usd).toBe(49.99);
    });

    it("retorna 500 cuando el servicio lanza error", async () => {
      mockGetActiveCombos.mockRejectedValue(new Error("DB Error"));

      const response = await getCombos();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
    });
  });
});
