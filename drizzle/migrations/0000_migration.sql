CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own clinic" ON public.clinics FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz
);
CREATE INDEX cards_clinic_created_idx ON public.cards (clinic_id, created_at DESC);
GRANT SELECT, UPDATE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owner reads cards" ON public.cards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()));
CREATE POLICY "Clinic owner marks cards opened" ON public.cards FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()));
REVOKE UPDATE ON public.cards FROM authenticated;
GRANT UPDATE (opened_at) ON public.cards TO authenticated;