import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { getShared, markReviewed } from "@/features/doctor/api";
import { FIELDS, MISSING } from "@/features/session/card";

export const Route = createFileRoute("/cabinet/$cardId")({
  component: CardView,
});

function CardView() {
  const { cardId } = Route.useParams();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: shared, isLoading } = useQuery({ queryKey: ["shared-card", cardId], queryFn: () => getShared(cardId), retry: false });

  if (isLoading) return <p className="text-muted-foreground">Загрузка…</p>;
  if (!shared) return <p className="text-missing">Карточка не найдена. <Link to="/cabinet" className="underline">К списку</Link></p>;

  const { card } = shared;
  // Built only from the patient's own filled lines, in the card's order.
  const values = FIELDS.map(f => card.fields[f.id]?.value).filter((v): v is string => Boolean(v));
  const phrase = values.length ? values.map(v => v.replace(/[.\s]+$/, "")).join(". ") + "." : MISSING;
  const reviewed = shared.status === "REVIEWED";

  const review = async () => {
    setBusy(true);
    try {
      queryClient.setQueryData(["shared-card", cardId], await markReviewed(cardId));
      void queryClient.invalidateQueries({ queryKey: ["shared-cards"] });
    } finally { setBusy(false); }
  };

  return (
    <article className="space-y-4">
      <div className="no-print flex items-center justify-between gap-2">
        <Link to="/cabinet" className="underline">← К списку</Link>
        <div className="flex gap-2">
          <button type="button" disabled={reviewed || busy} className="border px-3 py-1.5 disabled:opacity-50" onClick={() => void review()}>{reviewed ? "Просмотрена" : "Отметить просмотренной"}</button>
          <button type="button" className="border border-foreground bg-primary px-3 py-1.5 text-primary-foreground" onClick={() => window.print()}>Печать</button>
        </div>
      </div>
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Карточка пациентки · {shared.patient.displayName}</p>
        <h1 className="text-lg font-semibold">Получена {new Date(shared.sharedAt).toLocaleString("ru-RU")}</h1>
        {shared.urgent && <p className="border border-destructive px-2 py-1 font-semibold text-destructive">В разговоре сработал сигнал срочности. Пациентке показан совет срочно позвонить 103 или 112.</p>}
        {shared.newerDraftExists && <p className="border px-2 py-1 text-muted-foreground">Пациентка исправила карточку после отправки. Здесь — версия, которую она отправила.</p>}
      </header>

      <table className="w-full border-collapse border text-left">
        <thead className="bg-secondary">
          <tr>
            <th className="w-1/4 border px-2 py-1 font-medium">Поле</th>
            <th className="border px-2 py-1 font-medium">Значение</th>
            <th className="w-1/3 border px-2 py-1 font-medium">Цитата</th>
          </tr>
        </thead>
        <tbody>
          {FIELDS.map(({ id, label }) => {
            const f = card.fields[id];
            const value = f?.value ?? null;
            // The quote was not found word for word in what the patient said.
            const uncertain = Boolean(value) && !f?.editedByPatient && !f?.quoteVerified;
            return (
              <tr key={id}>
                <td className="border px-2 py-1 align-top">{label}</td>
                <td className="border px-2 py-1 align-top">
                  {value ? <span>{value}</span> : <span className="text-missing">{MISSING}</span>}
                  {uncertain && <span className="ml-2 border border-foreground px-1 font-mono text-xs">⚠ Проверьте</span>}
                  {f?.editedByPatient && <span className="block text-xs text-muted-foreground">Исправлено пациенткой</span>}
                </td>
                <td className={`border px-2 py-1 align-top font-mono text-xs ${f?.quote ? "" : "text-missing"}`}>{f?.quote ? `«${f.quote}»` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="space-y-1">
        <h2 className="font-semibold">Что пациентка хочет сказать</h2>
        <p className={phrase === MISSING ? "text-missing" : ""}>{phrase}</p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold">Вопросы пациентки</h2>
        {card.doctorQuestions.length ? <ul className="list-disc pl-5">{card.doctorQuestions.map(q => <li key={q}>{q}</li>)}</ul> : <p className="text-missing">{MISSING}</p>}
      </section>
    </article>
  );
}
