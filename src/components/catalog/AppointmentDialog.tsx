"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTrapTab } from "./useTrapTab";
import { useTx } from "@/lib/i18n";
import { ADDRESS } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";

type Props = { open: boolean; onClose: () => void; fixture: Fixture };

const WHEN = [
  { id: "weekday-morning", he: "ביום חול, בבוקר", en: "Weekday morning" },
  { id: "weekday-noon", he: "ביום חול, בצהריים", en: "Weekday noon" },
  { id: "weekday-evening", he: "ביום חול, אחר הצהריים", en: "Weekday afternoon" },
  { id: "friday", he: "ביום שישי בבוקר", en: "Friday morning" },
];

/** "ראו באולם": name, phone, preferred time → requestAppointment, then a quiet confirmation. */
export function AppointmentDialog({ open, onClose, fixture }: Props) {
  const t = useTx();
  const requestAppointment = useStore((s) => s.requestAppointment);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState(WHEN[0].id);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useTrapTab(bodyRef, open);

  useEffect(() => { if (open) { setSent(false); setError(null); } }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 7) {
      setError(t({ he: "נשמח לשם ולמספר טלפון תקין.", en: "A name and a valid phone number, please." }));
      return;
    }
    const w = WHEN.find((x) => x.id === when);
    requestAppointment({ fixtureId: fixture.id, name: name.trim(), phone: phone.trim(), when: w ? w.he : when });
    setSent(true);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "ראו באולם", en: "See it in the showroom" })}>
      <div ref={bodyRef}>
      {sent ? (
        <div className="flex flex-col gap-4" data-testid="appointment-success" aria-live="polite">
          <p className="font-display text-2xl lit-text">{t({ he: "נחזור אליכם לתיאום ביקור באולם בבני ברק", en: "We’ll call you back to arrange a visit to the Bnei Brak showroom" })}</p>
          <p className="text-sm text-muted">{t(ADDRESS)}</p>
          <p className="text-sm text-muted">
            <span lang="en" className="text-paper">{fixture.name}</span> {t({ he: "ימתין דלוק.", en: "will be waiting, switched on." })}
          </p>
          <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="btn">{t({ he: "סגירה", en: "Close" })}</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" data-testid="appointment-form">
          <p className="text-sm text-muted">
            {t({ he: "באולם התצוגה בבני ברק אפשר לראות את", en: "In the Bnei Brak showroom you can see" })} <span lang="en" className="text-paper">{fixture.name}</span> {t({ he: "דלוק, לצד שאר הקולקציה.", en: "lit, next to the rest of the collection." })}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "שם", en: "Name" })}</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required data-testid="appt-name" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "טלפון", en: "Phone" })}</span>
            <input className="field num" type="tel" inputMode="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required data-testid="appt-phone" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t({ he: "מתי נוח לכם", en: "Preferred time" })}</span>
            <select className="field" value={when} onChange={(e) => setWhen(e.target.value)} data-testid="appt-when">
              {WHEN.map((w) => <option key={w.id} value={w.id}>{t({ he: w.he, en: w.en })}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-brass-light">{error}</p>}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn">{t({ he: "ביטול", en: "Cancel" })}</button>
            <button type="submit" className="btn btn-primary" data-testid="appt-submit">{t({ he: "שליחת בקשה", en: "Send request" })}</button>
          </div>
        </form>
      )}
      </div>
    </Dialog>
  );
}
