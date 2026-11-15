import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { FIELDS } from '@/features/session/card';
import { clinicEmail, generateCode, isValidCode, normalizeCode } from './clinic';

const fieldSchema = z.object({
  value: z.string().max(2000).nullable(),
  quote: z.string().max(2000).nullable(),
  edited: z.boolean(),
  uncertain: z.boolean(),
});
const cardSchema = z.object({
  source: z.enum(['text', 'voice']),
  transcript: z.string().max(20000),
  fields: z.object(Object.fromEntries(FIELDS.map(f => [f.id, fieldSchema])) as Record<(typeof FIELDS)[number]['id'], typeof fieldSchema>),
  questions: z.array(z.string().max(500)).max(20),
  urgent: z.boolean(),
  sentAt: z.string().max(40).nullable(),
  createdAt: z.string().max(40),
});

export const registerClinic = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ name: z.string().trim().min(2).max(120), password: z.string().min(8).max(72) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email: clinicEmail(code), password: data.password, email_confirm: true });
      if (error) { console.error('createUser failed', error.message); if (/already/i.test(error.message)) continue; return { ok: false as const, reason: /weak|password/i.test(error.message) ? 'weak' as const : 'server' as const }; }
      const { error: insertError } = await supabaseAdmin.from('clinics').insert({ owner_id: created.user.id, code, name: data.name });
      if (insertError) { console.error('clinic insert failed', insertError.message); await supabaseAdmin.auth.admin.deleteUser(created.user.id); continue; }
      return { ok: true as const, code };
    }
    return { ok: false as const, reason: 'server' as const };
  });

/** Public: a patient sends her card to the clinic named in her link. Only the clinic owner can read it back. */
export const submitCard = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ clinic: z.string().max(20), card: cardSchema }).parse(input))
  .handler(async ({ data }) => {
    const code = normalizeCode(data.clinic);
    if (!isValidCode(code)) return { ok: false as const, reason: 'clinic' as const };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: clinic } = await supabaseAdmin.from('clinics').select('id').eq('code', code).maybeSingle();
    if (!clinic) return { ok: false as const, reason: 'clinic' as const };
    const { error } = await supabaseAdmin.from('cards').insert({ clinic_id: clinic.id, payload: data.card, urgent: data.card.urgent });
    if (error) { console.error('card insert failed', error.message); return { ok: false as const, reason: 'server' as const }; }
    return { ok: true as const };
  });
