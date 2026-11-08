"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTrapTab } from "./useTrapTab";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { CartItem } from "@/lib/types";

type Props = { open: boolean; onClose: () => void; cart: CartItem[]; total: number };

/**
 * "בקשת הצעת מחיר" for private customers: name / phone / email → an
 * appointment.requested event with {cart:true}, then a success panel.
 */
export function QuoteRequestDialog({ open, onClose, cart, total }: Props) {
  const t = useTx();
  const lang = useLang();
  const logEvent = useStore((s) => s.logEvent);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = cart.reduce((n, c) => n + c.qty, 0);
  const bodyRef = useRef<HTMLDivElement>(null);
  useTrapTab(bodyRef, open);

  useEffect(() => { if (open) { setSent(false); setError(null); } }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 7 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t({ he: "נשמח לשם, טלפון תקין וכתובת דוא״ל.", en: "A name, a valid phone number and an email, please." }));
      return;
    }
    logEvent({
      actor: "designer",
      type: "appointment.requested",
      title: {
        he: `בקשת הצעת מחיר מהסל — ${count} פריטים · ${formatIls(total, "he")}`,
        en: `Quote request from cart — ${count} items · ${formatIls(total, "en")}`,
      },
      payload: {
        cart: true,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        lines: cart.map((c) => ({ fixtureId: c.fixtureId, qty: c.qty, finish: c.finish })),
        total,
      },
    });
    setSent(true);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "בקשת הצעת מחיר", en: "Request a quote" })}>
      <div ref={bodyRef}>
      {sent ? (
        <div className="flex flex-col gap-4" data-testid="quote-success" aria-live="polite">
          <p className="font-display text-2xl lit-text">{t({ he: "הבקשה התקבלה", en: "Request received" })}</p>
          <p className="text-sm text-muted">
            {t({
              he: "נחזור אליכם עם הצעת מחיר מסודרת, כולל זמני אספקה והובלה. אפשר גם לקבוע ביקור באולם בבני ברק ולראות הכול דלוק.",
              en: "We’ll come back with a proper quote, including lead times and delivery. You can also book a visit to the Bnei Brak showroom and see everything lit.",
            })}
          </p>
          <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="btn">{t({ he: "סגירה", en: "Close" })}</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" data-testid="quote-form">
          <p className="text-sm text-muted">
            {count === 1 ? t({ he: "פריט אחד", en: "1 item" }) : `${count} ${t({ he: "פריטים", en: "items" })}`} · <span className="num" dir="ltr">{formatIls(total, lang)}</span> · {t({ he: "מחירי הדגמה כולל מע״מ", en: "demo prices incl. VAT" })}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "שם", en: "Name" })}</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required data-testid="quote-name" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "טלפון", en: "Phone" })}</span>
            <input className="field num" type="tel" inputMode="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required data-testid="quote-phone" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "דוא״ל", en: "Email" })}</span>
            <input className="field" type="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required data-testid="quote-email" />
          </label>
          {error && <p role="alert" className="text-sm text-brass-light">{error}</p>}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn">{t({ he: "ביטול", en: "Cancel" })}</button>
            <button type="submit" className="btn btn-primary" data-testid="quote-submit">{t({ he: "שליחת הבקשה", en: "Send request" })}</button>
          </div>
        </form>
      )}
      </div>
    </Dialog>
  );
}
