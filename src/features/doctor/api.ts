// Doctor cabinet data: cards that patients chose to send, and invitations. Contracts: docs/API_CONTRACTS.md in the backend repository.
import { api } from '@/shared/api/client';

export type SharedRow = {
  intakeId: string;
  sharedAt: string;
  status: 'SHARED' | 'REVIEWED';
  urgent: boolean;
  patient: { id: string; displayName: string };
  summary: string | null;
};

export type SharedField = { value: string | null; quote: string | null; quoteVerified: boolean; editedByPatient: boolean };

export type SharedCard = {
  intakeId: string;
  sharedAt: string;
  status: 'SHARED' | 'REVIEWED';
  urgent: boolean;
  patient: { id: string; displayName: string };
  card: { version: number; fields: Record<string, SharedField>; doctorQuestions: string[] };
  /** The patient changed the card after sending it; the doctor still sees the version that was sent. */
  newerDraftExists: boolean;
};

export const listShared = () => api<{ items: SharedRow[] }>('GET', '/api/doctor/intakes?pageSize=100').then(r => r.items);
export const getShared = (intakeId: string) => api<SharedCard>('GET', `/api/doctor/intakes/${intakeId}`);
export const markReviewed = (intakeId: string) => api<SharedCard>('PATCH', `/api/doctor/intakes/${intakeId}`, { reviewed: true });

/** Adds a patient and returns her one-time invitation code. The code is shown once and is not stored in the open. */
export async function invitePatient(displayName: string): Promise<{ token: string; expiresAt: string }> {
  const res = await api<{ invitation: { token: string; expiresAt: string } }>('POST', '/api/doctor/patients', { displayName, locale: 'ru' });
  return res.invitation;
}

/** Link the patient opens to set her own login and password. */
export const inviteLink = (origin: string, token: string) => `${origin}/invite?token=${encodeURIComponent(token)}`;
