"use client";

import { useState, useEffect } from "react";
import { useRemittanceCalculator } from "@/hooks/useRemittanceCalculator";
import { generateWhatsAppOrderUrl } from "@/lib/utils/whatsapp";
import type {
  SenderData,
  BeneficiaryData,
  WhatsAppOrderData,
} from "@/types";

type FieldErrors = Partial<Record<keyof SenderData | keyof BeneficiaryData, boolean>>;

/* ─── SVG Icons ─── */

function IconUser({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconUserGroup({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function IconClipboard({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  );
}

function IconPhone({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function IconIdCard({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  );
}

function IconMapPin({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconGlobe({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function IconCreditCard({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function IconTruck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function IconDollar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconWhatsApp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Componente Principal ─── */

export function CheckoutForm({
  whatsappPhone,
}: {
  whatsappPhone?: string;
}) {
  const {
    currencies,
    paymentMethods,
    filteredPaymentMethods,
    deliveryMethods,
    selectedPaymentMethod,
    selectedDeliveryMethod,
    originCountry,
    originCurrency,
    amount,
    receivingAmount,
    rateMultiplier,
    calculate,
    selectPaymentMethod,
    selectDeliveryMethod,
    setOriginCountry,
    setOriginCurrency,
    setAmount,
  } = useRemittanceCalculator();

  // Auto-calcular tasa cuando todos los campos necesarios están completos
  useEffect(() => {
    if (selectedPaymentMethod && selectedDeliveryMethod && amount > 0 && originCountry) {
      calculate();
    }
  }, [selectedPaymentMethod, selectedDeliveryMethod, amount, originCountry, calculate]);

  const [sender, setSender] = useState<SenderData>({
    fullName: "",
    phone: "",
    country: "",
  });
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [beneficiary, setBeneficiary] = useState<BeneficiaryData>({
    fullName: "",
    idCard: "",
    phone: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresBankData =
    selectedDeliveryMethod?.type === "transfer" ||
    selectedDeliveryMethod?.type === "card";

  function handleCountrySelect(val: string) {
    setSelectedCountryId(val);
    if (val === "__OTHER__") {
      setOriginCurrency("__OTHER__");
      setOriginCountry("Otro país");
    } else {
      const cur = currencies.find((c) => c.id === val);
      if (cur) {
        setOriginCurrency(cur.code);
        setOriginCountry(cur.name);
      }
    }
  }

  function handleSenderChange(field: keyof SenderData, value: string) {
    setSender((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleBeneficiaryChange(field: keyof BeneficiaryData, value: string) {
    setBeneficiary((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!sender.fullName.trim()) errors.fullName = true;
    if (!sender.phone.trim()) errors.phone = true;
    if (!beneficiary.fullName.trim()) errors.fullName = true;
    if (!beneficiary.idCard.trim()) errors.idCard = true;
    if (!beneficiary.phone.trim()) errors.phone = true;
    if (!beneficiary.address.trim()) errors.address = true;
    if (requiresBankData && !beneficiary.cardNumber?.trim()) errors.cardNumber = true;
    if (requiresBankData && !beneficiary.confirmationPhone?.trim()) errors.confirmationPhone = true;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    const orderData: WhatsAppOrderData = {
      sender: {
        fullName: sender.fullName.trim(),
        phone: sender.phone.trim(),
        country: sender.country.trim() || originCountry,
      },
      beneficiary: {
        fullName: beneficiary.fullName.trim(),
        idCard: beneficiary.idCard.trim(),
        phone: beneficiary.phone.trim(),
        address: beneficiary.address.trim(),
        ...(requiresBankData && beneficiary.cardNumber?.trim()
          ? { cardNumber: beneficiary.cardNumber.trim() }
          : {}),
        ...(requiresBankData && beneficiary.confirmationPhone?.trim()
          ? { confirmationPhone: beneficiary.confirmationPhone.trim() }
          : {}),
      },
      remittance: selectedPaymentMethod && selectedDeliveryMethod && amount > 0
        ? {
            rateMultiplier: rateMultiplier ?? 0,
            receivingAmount: receivingAmount ?? 0,
            originAmount: amount,
            originCountry,
            originCurrency,
            paymentMethod: selectedPaymentMethod.name,
            deliveryMethod: selectedDeliveryMethod.name,
          }
        : undefined,
      orderDate: new Date().toISOString(),
    };

    const url = generateWhatsAppOrderUrl(orderData, whatsappPhone);
    window.open(url, "_blank", "noopener,noreferrer");

    setIsSubmitting(false);
  }

  function inputClass(field: keyof SenderData | keyof BeneficiaryData) {
    if (fieldErrors[field]) return "w-full rounded-xl border-2 border-red-400 bg-red-50/40 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100";
    const val = ((sender as unknown as Record<string, string>)[field] ?? (beneficiary as unknown as Record<string, string>)[field] ?? "");
    if (val.trim().length > 0) return "w-full rounded-xl border-2 border-emerald-400/60 bg-emerald-50/30 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
    return "w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/15";
  }

  const hasRemittanceResult = receivingAmount !== null && receivingAmount > 0;

  return (
    <section
      id="checkout"
      aria-label="Formulario de envío"
      className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6"
    >
      {/* ─── Fondo decorativo ─── */}
      <div className="absolute inset-0 geo-grid opacity-20" aria-hidden="true" />
      {/* Círculo decorativo esquina superior derecha */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-brand-green/3 to-transparent blur-3xl" aria-hidden="true" />

      <div className="relative z-10">
        {/* ─── Título ─── */}
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green/15 to-brand-green/5 shadow-sm ring-1 ring-brand-green/10">
            <IconClipboard className="h-7 w-7 text-brand-green" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Datos del Envío
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Completa la información para enviar por WhatsApp
          </p>
        </div>

        {/* ─── Card principal con glass effect ─── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/75 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-10" noValidate>
              {/* ─── SECCIÓN 1: Métodos de pago y entrega ─── */}
              <div>
                <h3 className="mb-5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-green/15 to-brand-green/5 ring-1 ring-brand-green/10">
                    <IconCreditCard className="h-3.5 w-3.5 text-brand-green" />
                  </span>
                  Métodos de envío
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* País primero — en mobile el orden del DOM es el orden visual */}
                  <div className="sm:col-span-2">
                    <label htmlFor="co-country" className="mb-2 block text-sm font-semibold text-slate-700">
                      País de origen
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconGlobe className="h-4 w-4" />
                      </span>
                      <select
                        id="co-country"
                        value={selectedCountryId}
                        onChange={(e) => handleCountrySelect(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10"
                      >
                        <option value="" disabled>Seleccionar país de origen...</option>
                        {currencies.filter((c) => c.active).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                        <option value="__OTHER__">Otro país</option>
                      </select>
                      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="pm-select" className="mb-2 block text-sm font-semibold text-slate-700">
                      Método de pago
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconCreditCard className="h-4 w-4" />
                      </span>
                      <select
                        id="pm-select"
                        value={selectedPaymentMethod?.id ?? ""}
                        onChange={(e) => selectPaymentMethod(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10"
                        aria-label="Selecciona el método de pago"
                      >
                        <option value="" disabled>
                          Seleccionar...
                        </option>
                        {filteredPaymentMethods().map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="dm-select" className="mb-2 block text-sm font-semibold text-slate-700">
                      Método de entrega
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconTruck className="h-4 w-4" />
                      </span>
                      <select
                        id="dm-select"
                        value={selectedDeliveryMethod?.id ?? ""}
                        onChange={(e) => selectDeliveryMethod(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10"
                        aria-label="Selecciona el método de entrega"
                      >
                        <option value="" disabled>
                          Seleccionar...
                        </option>
                        {deliveryMethods.map((dm) => (
                          <option key={dm.id} value={dm.id}>
                            {dm.name}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="co-amount" className="mb-2 block text-sm font-semibold text-slate-700">
                      Cantidad a enviar
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                        $
                      </span>
                      <input
                        id="co-amount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={amount || ""}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-10 pr-16 text-lg font-bold text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-300 hover:border-slate-300 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
                        {originCurrency === "__OTHER__" ? "USD" : (originCurrency || "USD")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Divider dramático ─── */}
              <div className="flex items-center gap-4">
                <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-transparent via-brand-green/15 to-transparent" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  Datos personales
                </span>
                <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-transparent via-brand-green/15 to-transparent" />
              </div>

              {/* ─── SECCIÓN 2: Remitente y Beneficiario con conector visual ─── */}
              <div className="relative grid gap-8 lg:grid-cols-2">
                {/* ─── Conector visual: camino del dinero (desktop) ─── */}
                <div className="absolute left-1/2 top-0 z-0 hidden h-full w-px -translate-x-px lg:block" aria-hidden="true">
                  {/* Línea punteada vertical */}
                  <div className="h-full w-full bg-gradient-to-b from-brand-green/30 via-brand-green/15 to-brand-green/30" />
                  {/* Puntos animados sobre la línea */}
                  <div className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-green shadow-lg shadow-brand-green/40 animate-pulse" />
                  <div className="absolute left-1/2 top-1/3 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-green/60" />
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-green/30 bg-white shadow-md shadow-brand-green/10">
                    {/* Ícono de transferencia en el centro */}
                    <svg className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0 6.75 6.75M4.5 12l6.75-6.75" />
                    </svg>
                  </div>
                  <div className="absolute left-1/2 bottom-1/3 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-green/60" />
                  <div className="absolute left-1/2 bottom-4 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-green shadow-lg shadow-brand-green/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
                </div>

                {/* ─── Conector horizontal (mobile) ─── */}
                <div className="flex items-center gap-3 lg:hidden" aria-hidden="true">
                  <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-brand-green/20 to-brand-green/5" />
                  <svg className="h-5 w-5 text-brand-green/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                  </svg>
                  <div className="h-0.5 flex-1 rounded-full bg-gradient-to-l from-brand-green/20 to-brand-green/5" />
                </div>

                {/* ─── Remitente ─── */}
                <fieldset className="relative z-10 rounded-2xl border-2 border-brand-green/10 bg-gradient-to-br from-white via-white to-brand-green-surface/50 p-5 shadow-md shadow-brand-green/5 sm:p-6">
                  <legend className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green/20 to-brand-green/5 shadow-sm ring-1 ring-brand-green/10">
                      <IconUser className="h-4.5 w-4.5 text-brand-green" />
                    </span>
                    Remitente (Emisor)
                  </legend>
                  <div className="mt-5 space-y-4">
                    {/* Nombre completo */}
                    <div>
                      <label htmlFor="sender-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200">
                          <IconUser className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="sender-name"
                          type="text"
                          required
                          value={sender.fullName}
                          onChange={(e) => handleSenderChange("fullName", e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          className={inputClass("fullName")}
                        />
                      </div>
                      {fieldErrors.fullName && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label htmlFor="sender-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconPhone className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="sender-phone"
                          type="tel"
                          required
                          value={sender.phone}
                          onChange={(e) => handleSenderChange("phone", e.target.value)}
                          placeholder="+1 555 123 4567"
                          className={inputClass("phone")}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                  </div>
                </fieldset>

                {/* ─── Beneficiario ─── */}
                <fieldset className="relative z-10 rounded-2xl border-2 border-red-100/50 bg-gradient-to-br from-white via-white to-red-50/30 p-5 shadow-md shadow-red-100/20 sm:p-6">
                  <legend className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-50 shadow-sm ring-1 ring-red-200/50">
                      <IconUserGroup className="h-4.5 w-4.5 text-brand-red" />
                    </span>
                    Beneficiario (Receptor en Cuba)
                  </legend>
                  <div className="mt-5 space-y-4">
                    {/* Nombre completo */}
                    <div>
                      <label htmlFor="beneficiary-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconUser className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="beneficiary-name"
                          type="text"
                          required
                          value={beneficiary.fullName}
                          onChange={(e) => handleBeneficiaryChange("fullName", e.target.value)}
                          placeholder="Ej: María García"
                          className={inputClass("fullName")}
                        />
                      </div>
                      {fieldErrors.fullName && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                    {/* Carnet de Identidad */}
                    <div>
                      <label htmlFor="beneficiary-idcard" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Carnet de Identidad *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconIdCard className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="beneficiary-idcard"
                          type="text"
                          required
                          value={beneficiary.idCard}
                          onChange={(e) => handleBeneficiaryChange("idCard", e.target.value)}
                          placeholder="Ej: 12345678901"
                          className={inputClass("idCard")}
                        />
                      </div>
                      {fieldErrors.idCard && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label htmlFor="beneficiary-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconPhone className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="beneficiary-phone"
                          type="tel"
                          required
                          value={beneficiary.phone}
                          onChange={(e) => handleBeneficiaryChange("phone", e.target.value)}
                          placeholder="+53 5 123 4567"
                          className={inputClass("phone")}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                    {/* Dirección */}
                    <div>
                      <label htmlFor="beneficiary-address" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Dirección *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconMapPin className="h-4.5 w-4.5" />
                        </span>
                        <input
                          id="beneficiary-address"
                          type="text"
                          required
                          value={beneficiary.address}
                          onChange={(e) => handleBeneficiaryChange("address", e.target.value)}
                          placeholder="Ej: Calle 23 #456, Vedado, La Habana"
                          className={inputClass("address")}
                        />
                      </div>
                      {fieldErrors.address && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Campo obligatorio
                        </p>
                      )}
                    </div>

                    {/* Datos bancarios — solo si el método de entrega los requiere */}
                    {requiresBankData && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="h-px flex-1 bg-amber-200" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                            💳 Datos de transferencia
                          </span>
                          <div className="h-px flex-1 bg-amber-200" />
                        </div>

                        {/* Número de tarjeta */}
                        <div>
                          <label htmlFor="beneficiary-card" className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Número de tarjeta *
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400">
                              <IconCreditCard className="h-4.5 w-4.5" />
                            </span>
                            <input
                              id="beneficiary-card"
                              type="text"
                              inputMode="numeric"
                              required
                              value={beneficiary.cardNumber ?? ""}
                              onChange={(e) => handleBeneficiaryChange("cardNumber", e.target.value)}
                              placeholder="Ej: 9204 1234 5678 9012"
                              className={inputClass("cardNumber")}
                            />
                          </div>
                          {fieldErrors.cardNumber && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              Campo obligatorio
                            </p>
                          )}
                        </div>

                        {/* Teléfono de confirmación */}
                        <div>
                          <label htmlFor="beneficiary-confirm-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Teléfono de confirmación *
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400">
                              <IconPhone className="h-4.5 w-4.5" />
                            </span>
                            <input
                              id="beneficiary-confirm-phone"
                              type="tel"
                              required
                              value={beneficiary.confirmationPhone ?? ""}
                              onChange={(e) => handleBeneficiaryChange("confirmationPhone", e.target.value)}
                              placeholder="+53 5 123 4567"
                              className={inputClass("confirmationPhone")}
                            />
                          </div>
                          {fieldErrors.confirmationPhone && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              Campo obligatorio
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </fieldset>
              </div>

              {/* ─── Resultado de la calculadora ─── */}
              {hasRemittanceResult ? (
                <div className="animate-fade-in-up overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-dark via-brand-green to-brand-green-light shadow-xl shadow-brand-green/25">
                  {/* Brillo decorativo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" aria-hidden="true" />
                  <div className="relative px-6 py-6 text-center sm:px-8 sm:py-7">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200/90">
                      💵 Recibe en Cuba aproximadamente
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
                      ${receivingAmount!.toFixed(2)}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3 text-xs font-medium text-green-200/70">
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-green-300" />
                        Tasa aplicada
                      </span>
                      <span className="text-white/80">·</span>
                      <span>
                        {originCurrency} → CUP
                      </span>
                    </div>
                  </div>
                  {/* Línea decorativa inferior con brillo */}
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-green-300/50 to-transparent" aria-hidden="true" />
                </div>
              ) : (
                /* Hint: calcula tu remesa primero */
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-5 text-center">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-700">
                    Primero calcula tu remesa arriba ↑
                  </p>
                  <p className="text-xs text-amber-500">
                    Usa la calculadora para ver el monto que recibirá tu familia
                  </p>
                </div>
              )}

              {/* ─── Botón Enviar por WhatsApp ─── */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#25D366] px-6 py-4.5 text-base font-bold text-white shadow-xl shadow-[#25D366]/30 transition-all duration-300 hover:bg-[#1fb855] hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-xl disabled:active:scale-100"
              >
                {/* Brillo hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
                <IconWhatsApp className="relative z-10 h-5 w-5" />
                <span className="relative z-10">
                  {isSubmitting ? "Abriendo WhatsApp..." : "Enviar por WhatsApp"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

