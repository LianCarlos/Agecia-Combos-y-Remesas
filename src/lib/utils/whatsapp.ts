import type { WhatsAppOrderData } from "@/types";

const ADMIN_PHONE = "5355555555";
const SEP = "─────────────────";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

function buildSenderSection(orderData: WhatsAppOrderData): string[] {
  const s = orderData.sender;
  if (!s || !s.fullName.trim()) return [];
  return [
    "",
    SEP,
    "EMISOR",
    `Nombre: ${s.fullName}`,
    `Telefono: ${s.phone}`,
    `Pais: ${s.country}`,
  ];
}

function buildRemittanceSection(orderData: WhatsAppOrderData): string[] {
  if (!orderData.remittance) return [];
  const r = orderData.remittance;
  const lines = [
    "",
    SEP,
    "DATOS DE LA REMESA",
    `Pais origen: ${r.originCountry}`,
    `Metodo de pago: ${r.paymentMethod}`,
    `Metodo de entrega: ${r.deliveryMethod}`,
    `Cantidad enviada: $${r.originAmount.toFixed(2)} ${r.originCurrency}`,
  ];
  if (r.receivingAmount > 0) {
    lines.push(`Recibe en Cuba: $${r.receivingAmount.toFixed(2)}`);
  }
  if (r.rateMultiplier > 0) {
    lines.push(`Tasa aplicada: ${r.rateMultiplier}x`);
  }
  return lines;
}

function buildComboSection(orderData: WhatsAppOrderData): string[] {
  if (!orderData.combo) return [];
  const c = orderData.combo;
  return [
    "",
    SEP,
    "COMBO",
    `Combo: ${c.title}`,
    `Precio unitario: $${c.price_usd.toFixed(2)} USD`,
    `Cantidad: ${c.quantity}`,
    `Total combo: $${c.total.toFixed(2)} USD`,
  ];
}

function buildCartSection(orderData: WhatsAppOrderData): string[] {
  if (!orderData.cart || orderData.cart.items.length === 0) return [];
  const { items, total, paymentMethod, payAmountLabel } = orderData.cart;
  const lines = ["", SEP, "PEDIDO (COMBOS Y PRODUCTOS)"];
  for (const it of items) {
    const lineTotal = it.price_usd * it.quantity;
    const tag = it.kind === "combo" ? "[Combo]" : "[Producto]";
    lines.push(
      `- ${it.quantity}x ${tag} ${it.title} — $${it.price_usd.toFixed(2)} c/u = $${lineTotal.toFixed(2)}`
    );
  }
  lines.push(`TOTAL: $${total.toFixed(2)} USD`);
  if (paymentMethod) lines.push(`Metodo de pago: ${paymentMethod}`);
  if (payAmountLabel) lines.push(`Monto a pagar: ${payAmountLabel}`);
  return lines;
}

export function generateWhatsAppOrderUrl(
  orderData: WhatsAppOrderData,
  adminPhone?: string
): string {
  const phone = adminPhone ?? ADMIN_PHONE;
  const b = orderData.beneficiary;

  const beneficiaryLines = [
    `Nombre: ${b.fullName}`,
    `CI: ${b.idCard}`,
    `Telefono: ${b.phone}`,
    `Direccion: ${b.address}`,
  ];

  if (b.cardNumber?.trim()) {
    beneficiaryLines.push(`Tarjeta: ${b.cardNumber.trim()}`);
  }
  if (b.confirmationPhone?.trim()) {
    beneficiaryLines.push(`Tel. confirmacion: ${b.confirmationPhone.trim()}`);
  }

  const lines: string[] = [
    "NUEVA SOLICITUD - Mr Factus Remesas",
    ...buildSenderSection(orderData),
    "",
    SEP,
    "BENEFICIARIO",
    ...beneficiaryLines,
    ...buildRemittanceSection(orderData),
    ...buildComboSection(orderData),
    ...buildCartSection(orderData),
    "",
    SEP,
    `Fecha: ${formatDate(orderData.orderDate)}`,
    "",
    "mrfactusremesas.com",
  ];

  // join("\n") — encodeURIComponent convierte \n → %0A correctamente
  const message = lines.join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
