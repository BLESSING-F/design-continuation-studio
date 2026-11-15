import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { FIELDS, MISSING, doctorPhrase, type Card } from "@/features/session/card";

export const Route = createFileRoute("/cabinet/$cardId")({
  component: CardView,
});

function CardView() {
  const { cardId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: row, isLoading } = useQuery({ queryKey: ["card", cardId], queryFn: async () => {
    const { data, error } = await supabase.from("cards").select("id, created_at, opened_at, urgent, payload").eq("id", cardId).maybeSingle();
    if (error) throw error;
    return data;
  } });

  useEffect(() => {
    if (row && !row.opened_at) {
      void supabase.from("cards").update({ opened_at: new Date().toISOString() }).eq("id", row.id).then(() => queryClient.invalidateQueries({ queryKey: ["cards"] }));
    }
  }, [row, queryClient]);

  if (isLoading) return <p className="text-muted-foreground">Загрузка…</p>;
  if (!row) return <p className="text-missing">Карточка не найдена. <Link to="/cabinet" className="underline">К списку</Link></p>;

  const card = row.payload as unknown as Card;
  const phrase = doctorPhrase(card);

  return (
    <article className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link to="/cabinet" className="underline">← К списку</Link>
        <button type="button" className="border border-foreground bg-primary px-3 py-1.5 text-primary-foreground" onClick={() => window.print()}>Печать</button>
      </div>
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Карточка пациентки · {card.source === "voice" ? "разговор" : "текст"}</p>
        <h1 className="text-lg font-semibold">Получена {new Date(row.created_at).toLocaleString("ru-RU")}</h1>
        {row.urgent && <p className="border border-destructive px-2 py-1 font-semibold text-destructive">Пациентке показан совет срочно позвонить 103 или 112.</p>}
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
            const f = card.fields?.[id];
            const value = f?.value ?? null;
            return (
              <tr key={id}>
                <td className="border px-2 py-1 align-top">{label}</td>
                <td className="border px-2 py-1 align-top">
                  {value ? <span>{value}</span> : <span className="text-missing">{MISSING}</span>}
                  {f?.uncertain && <span className="ml-2 border border-foreground px-1 font-mono text-xs">⚠ Проверьте</span>}
                  {f?.edited && <span className="block text-xs text-muted-foreground">Исправлено пациенткой</span>}
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
        {card.questions?.length ? <ul className="list-disc pl-5">{card.questions.map(q => <li key={q}>{q}</li>)}</ul> : <p className="text-missing">{MISSING}</p>}
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold">Слова пациентки полностью</h2>
        <p className={`whitespace-pre-wrap border p-2 font-mono text-xs ${card.transcript ? "" : "text-missing"}`}>{card.transcript || MISSING}</p>
      </section>
    </article>
  );
}
