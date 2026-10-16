// Enlaces de teléfono. La normalización es la misma que server/src/phone.ts: 10 dígitos de
// EE. UU./Canadá → +1; móvil venezolano 04xx → +58; el resto se deja tal cual (ya con código de país).
const VE_MOBILE = /^0(41[246]|42[246])\d{7}$/;
const NANP_10 = /^[2-9]\d{2}[2-9]\d{6}$/;

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (NANP_10.test(d)) d = '1' + d;
  else if (VE_MOBILE.test(d)) d = '58' + d.slice(1);
  return d.length >= 8 ? d : null;
}

// "Llamar por WhatsApp": abre el chat del contacto en el WhatsApp del agente (su teléfono o
// WhatsApp Web) y desde ahí toca el ícono de llamada. No pasa por el CRM ni queda registro.
export function waCallLink(raw: string | null | undefined): string | null {
  const d = normalizePhone(raw);
  return d ? `https://wa.me/${d}` : null;
}
