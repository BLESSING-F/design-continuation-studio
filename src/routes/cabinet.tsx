import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

import { logout, useRequireRole } from "@/features/auth/session";

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

/** Doctor cabinet shell. Sign-in is the shared /login screen; the role comes from the session. */
function CabinetLayout() {
  const navigate = useNavigate();
  const me = useRequireRole("DOCTOR");
  const signOut = async () => { await logout(); void navigate({ to: "/login" }); };

  return (
    <div className="theme-doctor min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[210mm] space-y-4">
        {me && (
          <>
            <header className="no-print flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
              <Link to="/cabinet" className="font-semibold">Aldi · Кабинет врача</Link>
              <div className="flex items-baseline gap-3 text-muted-foreground">
                {me.doctor && <span>{me.doctor.displayName} · {me.doctor.clinic}</span>}
                <button type="button" className="border px-2 py-0.5 text-foreground" onClick={() => void signOut()}>Выйти</button>
              </div>
            </header>
            <Outlet />
          </>
        )}
      </div>
    </div>
  );
}
