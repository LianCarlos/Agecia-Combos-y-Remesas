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
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain("https://wa.me/5355555555?text=");
    expect(url).toContain(encodeURIComponent("NUEVA REMESA"));
    expect(url).toContain(encodeURIComponent("Juan Pérez"));
    expect(url).toContain(encodeURIComponent("María García"));
    expect(url).toContain(encodeURIComponent("500.00"));
    expect(url).toContain(encodeURIComponent("48750.00"));
  });

  // 2. Happy path - combo data (sin remittance)
  it("genera URL con datos de combo (sin remesa)", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      combo: mockCombo,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain("https://wa.me/5355555555?text=");
    expect(url).toContain(encodeURIComponent("NUEVA REMESA"));
    expect(url).toContain(encodeURIComponent("Combo Familiar"));
    expect(url).toContain(encodeURIComponent("49.99"));
    expect(url).toContain(encodeURIComponent("99.98"));
    // No debe contener sección de remesa (DATOS DE LA REMESA)
    expect(url).not.toContain(encodeURIComponent("DATOS DE LA REMESA"));
  });

  // 3. Happy path - ambos (remittance + combo)
  it("genera URL con ambos: remesa y combo", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
      combo: mockCombo,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain(encodeURIComponent("EMISOR"));
    expect(url).toContain(encodeURIComponent("BENEFICIARIO"));
    expect(url).toContain(encodeURIComponent("DATOS DE LA REMESA"));
    expect(url).toContain(encodeURIComponent("COMBO"));
    expect(url).toContain(encodeURIComponent("Orden generada desde Mr Factus"));
  });

  // 4. Admin phone por defecto
  it("usa el adminPhone por defecto si no se pasa parámetro", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain("https://wa.me/5355555555?text=");
  });

  // 5. Admin phone personalizado
  it("usa el adminPhone pasado como parámetro", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
    };
    const customPhone = "5359999999";

    const url = generateWhatsAppOrderUrl(order, customPhone);

    expect(url).toContain("https://wa.me/5359999999?text=");
  });

  // 6. Datos del remitente
  it("el mensaje contiene datos del remitente", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain(encodeURIComponent("Juan Pérez"));
    expect(url).toContain(encodeURIComponent("+5351234567"));
    expect(url).toContain(encodeURIComponent("Estados Unidos"));
  });

  // 7. Datos del beneficiario
  it("el mensaje contiene datos del beneficiario", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain(encodeURIComponent("María García"));
    expect(url).toContain(encodeURIComponent("85020112345"));
    expect(url).toContain(encodeURIComponent("+5359876543"));
    expect(url).toContain(encodeURIComponent("Calle 23 #456, Vedado, La Habana"));
  });

  // 8. URL encodeada correctamente
  it("la URL está correctamente encodeada con encodeURIComponent", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
      beneficiary: {
        ...mockBeneficiary,
        address: "Calle 23 #456, Vedado, La Habana",
      },
    };

    const url = generateWhatsAppOrderUrl(order);

    // Los espacios deben estar encodeados como %20
    expect(url).toContain("%20");
    // Las comas deben estar encodeadas
    expect(url).toContain("%2C");
  });

  // 9. Emojis relevantes
  it("el mensaje contiene emojis relevantes", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
      combo: mockCombo,
    };

    const url = generateWhatsAppOrderUrl(order);

    expect(url).toContain(encodeURIComponent("🏦"));
    expect(url).toContain(encodeURIComponent("📤"));
    expect(url).toContain(encodeURIComponent("📥"));
    expect(url).toContain(encodeURIComponent("💱"));
    expect(url).toContain(encodeURIComponent("📦"));
    expect(url).toContain(encodeURIComponent("✅"));
    expect(url).toContain(encodeURIComponent("📅"));
  });

  // 10. Formato de fecha en la orden
  it("contiene la fecha de la orden en el mensaje", () => {
    const order: WhatsAppOrderData = {
      ...baseOrder,
      remittance: mockRemittance,
      orderDate: "2026-06-02T14:30:00",
    };

    const url = generateWhatsAppOrderUrl(order);

    // La fecha se formatea con toLocaleDateString("es-ES")
    // El formato resultante es DD/MM/YYYY, HH:MM
    expect(url).toContain(encodeURIComponent("02/06/2026"));
  });
});
