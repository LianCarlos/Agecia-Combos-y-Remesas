import { generateWhatsAppOrderUrl } from "../whatsapp";
import type { WhatsAppOrderData } from "@/types";

const mockSender = {
  fullName: "Juan Pérez",
  phone: "+5351234567",
  country: "Estados Unidos",
};

const mockBeneficiary = {
  fullName: "María García",
  idCard: "85020112345",
  phone: "+5359876543",
  address: "Calle 23 #456, Vedado, La Habana",
};

const mockRemittance = {
  originAmount: 500,
  receivingAmount: 48750,
  rateMultiplier: 97.5,
  originCountry: "Estados Unidos",
  originCurrency: "USD",
  paymentMethod: "Zelle",
  deliveryMethod: "Efectivo USD",
};

const mockCombo = {
  title: "Combo Familiar",
  price_usd: 49.99,
  quantity: 2,
  total: 99.98,
};

const baseOrder: WhatsAppOrderData = {
  sender: mockSender,
  beneficiary: mockBeneficiary,
  orderDate: "2026-06-02T14:30:00",
};

describe("generateWhatsAppOrderUrl", () => {
  // 1. Happy path - remittance data (sin combo)
  it("genera URL con datos de remesa (sin combo)", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain("https://wa.me/5355555555?text=");
    expect(url).toContain(encodeURIComponent("NUEVA SOLICITUD - Mr Factus Remesas"));
    expect(url).toContain(encodeURIComponent("Juan Pérez"));
    expect(url).toContain(encodeURIComponent("María García"));
    expect(url).toContain(encodeURIComponent("500.00"));
    expect(url).toContain(encodeURIComponent("48750.00"));
    expect(url).toContain(encodeURIComponent("DATOS DE LA REMESA"));
  });

  // 2. Happy path - combo data (sin remittance)
  it("genera URL con datos de combo (sin remesa)", () => {
    const order: WhatsAppOrderData = { ...baseOrder, combo: mockCombo };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain("https://wa.me/5355555555?text=");
    expect(url).toContain(encodeURIComponent("COMBO"));
    expect(url).toContain(encodeURIComponent("Combo Familiar"));
    expect(url).toContain(encodeURIComponent("49.99"));
    expect(url).toContain(encodeURIComponent("99.98"));
    // No debe contener sección de remesa
    expect(url).not.toContain(encodeURIComponent("DATOS DE LA REMESA"));
  });

  // 3. Happy path - ambos (remittance + combo)
  it("genera URL con ambos: remesa y combo", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance, combo: mockCombo };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain(encodeURIComponent("EMISOR"));
    expect(url).toContain(encodeURIComponent("BENEFICIARIO"));
    expect(url).toContain(encodeURIComponent("DATOS DE LA REMESA"));
    expect(url).toContain(encodeURIComponent("COMBO"));
    expect(url).toContain(encodeURIComponent("mrfactusremesas.com"));
  });

  // 4. Admin phone por defecto
  it("usa el adminPhone por defecto si no se pasa parámetro", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };
    expect(generateWhatsAppOrderUrl(order)).toContain("https://wa.me/5355555555?text=");
  });

  // 5. Admin phone personalizado
  it("usa el adminPhone pasado como parámetro", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };
    expect(generateWhatsAppOrderUrl(order, "5359999999")).toContain("https://wa.me/5359999999?text=");
  });

  // 6. Datos del remitente
  it("el mensaje contiene datos del remitente", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };
    const url = generateWhatsAppOrderUrl(order);
    expect(url).toContain(encodeURIComponent("Juan Pérez"));
    expect(url).toContain(encodeURIComponent("+5351234567"));
    expect(url).toContain(encodeURIComponent("Estados Unidos"));
  });

  // 7. Datos del beneficiario
  it("el mensaje contiene datos del beneficiario", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };
    const url = generateWhatsAppOrderUrl(order);
    expect(url).toContain(encodeURIComponent("María García"));
    expect(url).toContain(encodeURIComponent("85020112345"));
    expect(url).toContain(encodeURIComponent("+5359876543"));
    expect(url).toContain(encodeURIComponent("Calle 23 #456, Vedado, La Habana"));
  });

  // 8. URL encodeada correctamente
  it("la URL está correctamente encodeada con encodeURIComponent", () => {
    const order: WhatsAppOrderData = { ...baseOrder, remittance: mockRemittance };
    const url = generateWhatsAppOrderUrl(order);
    expect(url).toContain("%20"); // espacios
    expect(url).toContain("%2C"); // comas
  });

  // 9. Sender opcional — sin emisor no aparece la sección EMISOR
  it("omite la sección EMISOR cuando no hay remitente (pedido de carrito)", () => {
    const order: WhatsAppOrderData = {
      beneficiary: mockBeneficiary,
      orderDate: "2026-06-02T14:30:00",
      cart: {
        items: [
          { id: "p1", kind: "product", title: "Aceite 1L", price_usd: 3.5, quantity: 2 },
          { id: "c1", kind: "combo", title: "Combo Básico", price_usd: 25, quantity: 1 },
        ],
        total: 32,
      },
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).not.toContain(encodeURIComponent("EMISOR"));
    expect(url).toContain(encodeURIComponent("PEDIDO (COMBOS Y PRODUCTOS)"));
    expect(url).toContain(encodeURIComponent("Aceite 1L"));
    expect(url).toContain(encodeURIComponent("Combo Básico"));
    expect(url).toContain(encodeURIComponent("TOTAL: $32.00 USD"));
  });

  // 10. Formato de fecha en la orden (DD/MM/YYYY)
  it("contiene la fecha de la orden en el mensaje", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
      orderDate: "2026-06-02T14:30:00",
    };
    const url = generateWhatsAppOrderUrl(order);
    expect(url).toContain(encodeURIComponent("02/06/2026"));
  });
});
