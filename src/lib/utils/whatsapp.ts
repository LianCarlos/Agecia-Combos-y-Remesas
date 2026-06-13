import type { WhatsAppOrderData } from "@/types";

const ADMIN_PHONE = "5355555555";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function buildRemittanceSection(orderData: WhatsAppOrderData): string[] {
  if (!orderData.remittance) return [];

  const r = orderData.remittance;

  return [
    "",
    "━━━━━━━━━━━━━━━",
    "💱 *DATOS DE LA REMESA*",
    `📤 *País origen:* ${r.originCountry}`,
    `💳 *Método de pago:* ${r.paymentMethod}`,
    `🚚 *Método de entrega:* ${r.deliveryMethod}`,
    `💰 *Cantidad enviada:* $${r.originAmount.toFixed(2)} ${r.originCurrency}`,
    `💵 *Recibe en Cuba:* $${r.receivingAmount.toFixed(2)}`,
    `📊 *Tasa aplicada:* ${r.rateMultiplier}x`,
  ];
}

function buildComboSection(orderData: WhatsAppOrderData): string[] {
  if (!orderData.combo) return [];

  const c = orderData.combo;

  return [
    "",
    "━━━━━━━━━━━━━━━",
    "📦 *COMBO*",
    `🛒 *Combo:* ${c.title}`,
    `💲 *Precio unitario:* $${c.price_usd.toFixed(2)} USD`,
    `🔢 *Cantidad:* ${c.quantity}`,
    `💵 *Total combo:* $${c.total.toFixed(2)} USD`,
  ];
}

export function generateWhatsAppOrderUrl(
  orderData: WhatsAppOrderData,
  adminPhone?: string
): string {
  const phone = adminPhone ?? ADMIN_PHONE;

  const lines: string[] = [
    "🏦 *NUEVA REMESA — Mr Factus*",
    "",
    "━━━━━━━━━━━━━━━",
    "📤 *EMISOR*",
    `   Nombre: ${orderData.sender.fullName}`,
    `   Teléfono: ${orderData.sender.phone}`,
    `   País: ${orderData.sender.country}`,
    "",
    "━━━━━━━━━━━━━━━",
    "📥 *BENEFICIARIO*",
    `   Nombre: ${orderData.beneficiary.fullName}`,
    `   CI: ${orderData.beneficiary.idCard}`,
    `   Teléfono: ${orderData.beneficiary.phone}`,
    `   Dirección: ${orderData.beneficiary.address}`,
    ...buildRemittanceSection(orderData),
    ...buildComboSection(orderData),
    "",
    "━━━━━━━━━━━━━━━",
    `📅 *Fecha:* ${formatDate(orderData.orderDate)}`,
    "",
    "✅ *Orden generada desde Mr Factus*",
  ];

  const message = lines.join("%0A");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

