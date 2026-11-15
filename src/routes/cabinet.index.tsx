import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";

import { inviteLink, invitePatient, listShared } from "@/features/doctor/api";
import { MISSING } from "@/features/session/card";

export const Route = createFileRoute("/cabinet/")({
  component: CardList,
});

// New cards appear without a reload.
const cardsQuery = { queryKey: ["shared-cards"], queryFn: listShared, refetchInterval: 5000 };

const fmt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** The doctor adds a patient and hands her a one-time link; she sets her own login and password. */
function InvitePatient() {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const invitation = await invitePatient(name.trim());
      setLink(inviteLink(window.location.origin, invitation.token));
      setExpires(fmt(invitation.expiresAt));
      setName("");
    } catch {
      setError("Не получилось создать приглашение. Попробуйте ещё раз.");
    } finally { setBusy(false); }
  };

  return (
    <section className="no-print space-y-3 border p-3">
      <h2 className="font-semibold">Пригласить пациентку</h2>
      <form onSubmit={e => void submit(e)} className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 space-y-1"><span className="block text-muted-foreground">Как записать пациентку в списке</span>
          <input value={name} onChange={e => setName(e.target.value)} autoComplete="off" className="w-full border px-2 py-1" />
        </label>
        <button type="submit" disabled={busy || name.trim().length === 0} className="border border-foreground bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50">Создать приглашение</button>
      </form>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {link && (
        <div className="flex flex-wrap items-start gap-4 border-t pt-3">
          <QRCodeSVG value={link} size={112} aria-label="QR-код приглашения" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-muted-foreground">Передайте пациентке эту ссылку или QR-код. Ссылка одноразовая и действует до {expires}. После закрытия страницы она больше не покажется.</p>
            <p className="break-all font-mono text-xs">{link}</p>
            <button type="button" className="border px-2 py-0.5" onClick={() => void navigator.clipboard.writeText(link)}>Скопировать ссылку</button>
          </div>
        </div>
      )}
    </section>
  );
}

function CardList() {
  const { data: cards, isLoading, isError } = useQuery(cardsQuery);

  return (
    <div className="space-y-6">
      <InvitePatient />

      <section className="space-y-2">
        <h1 className="text-lg font-semibold">Полученные карточки</h1>
        {isLoading ? <p className="text-muted-foreground">Загрузка…</p> : isError ? (
          <p role="alert" className="text-destructive">Не получилось загрузить карточки.</p>
        ) : !cards?.length ? (
          <p className="text-missing">Карточек пока нет.</p>
        ) : (
          <table className="w-full border-collapse border text-left">
            <thead className="bg-secondary">
              <tr>
                <th className="border px-2 py-1 font-medium">Получена</th>
                <th className="border px-2 py-1 font-medium">Пациентка</th>
                <th className="border px-2 py-1 font-medium">Что беспокоит</th>
                <th className="border px-2 py-1 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(row => (
                <tr key={row.intakeId} className={row.status === "REVIEWED" ? "" : "font-semibold"}>
                  <td className="border px-2 py-1 whitespace-nowrap"><Link to="/cabinet/$cardId" params={{ cardId: row.intakeId }} className="underline">{fmt(row.sharedAt)}</Link></td>
                  <td className="border px-2 py-1">{row.patient.displayName}</td>
                  <td className={`border px-2 py-1 ${row.summary ? "" : "text-missing"}`}>{row.summary ?? MISSING}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.urgent && <span className="mr-2 border border-destructive px-1 text-destructive">Срочно</span>}{row.status === "REVIEWED" ? "Просмотрена" : "Новая"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
