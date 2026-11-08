"use client";
import { useRef, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";
import { countFixtures, countItems, listValue } from "./labels";
import { useTrapTab } from "./useTrapTab";

/** Optional message → requestQuote. The summary says exactly what leaves the studio. */
export function QuoteRequestDialog({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const t = useTx();
  const lang = useLang();
  const requestQuote = useStore((s) => s.requestQuote);
  const [message, setMessage] = useState("");
  const items = countItems(project);
  const formRef = useRef<HTMLFormElement>(null);
  useTrapTab(formRef, open);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    requestQuote(project.id, message.trim() || undefined);
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "בקשת הצעת מחיר", en: "Request a quote" })}>
      <form ref={formRef} onSubmit={submit} className="grid gap-5">
        <dl className="grid grid-cols-3 gap-3 border-y hairline py-4 text-sm">
          <div>
            <dt className="text-muted">{t({ he: "חדרים", en: "Rooms" })}</dt>
            <dd className="num text-xl text-paper" dir="ltr">{project.rooms.length}</dd>
          </div>
          <div>
            <dt className="text-muted">{t({ he: "גופי תאורה", en: "Fixtures" })}</dt>
            <dd className="num text-xl text-paper" dir="ltr">{countFixtures(project)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t({ he: "לפי מחירון", en: "At list" })}</dt>
            <dd className="num text-xl text-paper" dir="ltr">{formatIls(listValue(project), lang)}</dd>
          </div>
        </dl>
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">{t({ he: "הודעה לצוות קמחי (לא חובה)", en: "A note for the Kamchi team (optional)" })}</span>
          <textarea
            className="field min-h-24 resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t({ he: "למשל: נשמח לדעת מה במלאי, ואיזה גימורים זמינים לנברשת.", en: "e.g. What is in stock, and which finishes are available for the chandelier?" })}
            data-autopilot="request-quote-message"
          />
        </label>
        <p className="text-xs text-muted">
          {t({ he: "הבקשה תגיע לשולחן הפרויקטים עם הלוח המלא. ", en: "The request lands on the project desk with the full board. " })}
          <span className="font-mono">{t(DEMO_PRICE)}</span>
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="btn" onClick={onClose}>{t({ he: "ביטול", en: "Cancel" })}</button>
          <button type="submit" className="btn btn-primary" disabled={items === 0} data-autopilot="request-quote-confirm">
            {t({ he: "שליחת הבקשה", en: "Send request" })}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
