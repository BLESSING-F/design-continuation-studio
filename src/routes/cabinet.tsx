import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { registerClinic } from "@/features/cabinet/cabinet.functions";
import { clinicEmail, isValidCode, normalizeCode } from "@/features/cabinet/clinic";

const meta = [
  { title: "Aldi" },
  { name: "description", content: "Aldi" },
  { property: "og:title", content: "Aldi" },
  { property: "og:description", content: "Aldi" },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
];

export const Route = createFileRoute("/cabinet")({
  ssr: false,
  head: () => ({ meta }),
  component: CabinetLayout,
});

export const clinicQuery = { queryKey: ["clinic"], queryFn: async () => {
  const { data, error } = await supabase.from("clinics").select("id, code, name").maybeSingle();
  if (error) throw error;
  return data;
} };

function CabinetLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const queryClient = useQueryClient();
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") { setSession(s); queryClient.clear(); }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <div className="theme-doctor min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[210mm] space-y-4">
        {session === undefined ? null : session ? <SignedIn /> : <DoctorLogin />}
      </div>
    </div>
  );
}

function SignedIn() {
  const queryClient = useQueryClient();
  const { data: clinic } = useQuery(clinicQuery);
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  };
  return (
    <>
      <header className="no-print flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
        <Link to="/cabinet" className="font-semibold">Aldi · Кабинет врача</Link>
        <div className="flex items-baseline gap-3 text-muted-foreground">
          {clinic && <span>{clinic.name} · код <span className="font-mono text-foreground">{clinic.code}</span></span>}
          <button type="button" className="border px-2 py-0.5 text-foreground" onClick={() => void signOut()}>Выйти</button>
        </div>
      </header>
      <Outlet />
    </>
  );
}

function DoctorLogin() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const register = useServerFn(registerClinic);

  const signIn = async (clinicCode: string) => {
    const { error: e } = await supabase.auth.signInWithPassword({ email: clinicEmail(clinicCode), password });
    if (e) setError("Неверный код клиники или пароль.");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const c = normalizeCode(code);
        if (!isValidCode(c)) { setError("Код клиники — 6 букв и цифр."); return; }
        await signIn(c);
      } else {
        if (name.trim().length < 2) { setError("Укажите название клиники."); return; }
        if (password.length < 8) { setError("Пароль — не короче 8 символов."); return; }
        const res = await register({ data: { name, password } });
        if (!res.ok) { setError(res.reason === "weak" ? "Этот пароль слишком простой или уже встречался в утечках. Выберите другой." : "Не получилось зарегистрировать клинику. Попробуйте ещё раз."); return; }
        setNewCode(res.code);
      }
    } finally { setBusy(false); }
  };

  if (newCode) {
    return (
      <section className="max-w-sm space-y-3 border p-4">
        <h1 className="text-lg font-semibold">Клиника зарегистрирована</h1>
        <p>Код вашей клиники:</p>
        <p className="border px-3 py-2 text-center font-mono text-2xl tracking-widest">{newCode}</p>
        <p className="text-muted-foreground">Запишите его. Вход в кабинет — по этому коду и паролю.</p>
        <button type="button" className="w-full border border-foreground bg-primary px-3 py-1.5 text-primary-foreground" onClick={() => void signIn(newCode)}>Войти в кабинет</button>
      </section>
    );
  }

  return (
    <form onSubmit={e => void submit(e)} className="max-w-sm space-y-3 border p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Aldi · Кабинет врача</p>
      <h1 className="text-lg font-semibold">{mode === "login" ? "Вход по коду клиники" : "Регистрация клиники"}</h1>
      {mode === "login" ? (
        <label className="block space-y-1"><span>Код клиники</span>
          <input value={code} onChange={e => setCode(e.target.value)} autoComplete="username" className="w-full border px-2 py-1 font-mono uppercase" placeholder="ABC123" />
        </label>
      ) : (
        <label className="block space-y-1"><span>Название клиники</span>
          <input value={name} onChange={e => setName(e.target.value)} autoComplete="organization" className="w-full border px-2 py-1" />
        </label>
      )}
      <label className="block space-y-1"><span>Пароль</span>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="w-full border px-2 py-1" />
      </label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <button type="submit" disabled={busy} className="w-full border border-foreground bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50">{mode === "login" ? "Войти" : "Зарегистрировать"}</button>
      <button type="button" className="w-full underline" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
        {mode === "login" ? "Зарегистрировать клинику" : "У меня уже есть код"}
      </button>
    </form>
  );
}
