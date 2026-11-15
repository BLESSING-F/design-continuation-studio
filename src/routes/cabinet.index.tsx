import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { patientLink } from "@/features/cabinet/clinic";
import { MISSING, type Card } from "@/features/session/card";
import { clinicQuery } from "./cabinet";

export const Route = createFileRoute("/cabinet/")({
  component: CardList,
});

const cardsQuery = { queryKey: ["cards"], queryFn: async () => {
  const { data, error } = await supabase.from("cards").select("id, created_at, opened_at, urgent, payload").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
} };

const fmt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function CardList() {
  const { data: clinic } = useQuery(clinicQuery);
  const { data: cards, isLoading } = useQuery(cardsQuery);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = clinic && origin ? patientLink(origin, clinic.code) : "";

  return (
    <div className="space-y-6">
      {clinic && (
        <section className="flex flex-wrap items-start gap-4 border p-3">
          {link && <QRCodeSVG value={link} size={112} aria-label="QR-код ссылки для пациенток" />}
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="font-semibold">Ссылка для пациенток</h2>
            <p className="text-muted-foreground">Дайте пациентке эту ссылку или QR-код. Её карточка придёт сюда.</p>
            <p className="break-all font-mono text-xs">{link}</p>
            <button type="button" className="border px-2 py-0.5" onClick={() => void navigator.clipboard.writeText(link)}>Скопировать ссылку</button>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h1 className="text-lg font-semibold">Полученные карточки</h1>
        {isLoading ? <p className="text-muted-foreground">Загрузка…</p> : !cards?.length ? (
          <p className="text-missing">Карточек пока нет.</p>
        ) : (
          <table className="w-full border-collapse border text-left">
            <thead className="bg-secondary">
              <tr>
                <th className="border px-2 py-1 font-medium">Получена</th>
                <th className="border px-2 py-1 font-medium">Что беспокоит</th>
                <th className="border px-2 py-1 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(row => {
                const card = row.payload as unknown as Card;
                const concern = card.fields?.concern?.value;
                return (
                  <tr key={row.id} className={row.opened_at ? "" : "font-semibold"}>
                    <td className="border px-2 py-1 whitespace-nowrap"><Link to="/cabinet/$cardId" params={{ cardId: row.id }} className="underline">{fmt(row.created_at)}</Link></td>
                    <td className={`border px-2 py-1 ${concern ? "" : "text-missing"}`}>{concern ?? MISSING}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{row.urgent && <span className="mr-2 border border-destructive px-1 text-destructive">Срочно</span>}{row.opened_at ? "Открыта" : "Новая"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
