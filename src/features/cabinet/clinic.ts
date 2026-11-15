// Pure clinic-code rules shared by browser and server.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function isValidCode(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every(ch => ALPHABET.includes(ch));
}
export function generateCode(random: () => number = Math.random): string {
  return Array.from({ length: CODE_LENGTH }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('');
}
/** Doctors sign in by clinic code; the account address is derived from it and never shown. */
export function clinicEmail(code: string): string {
  return `${normalizeCode(code).toLowerCase()}@clinic.aldi.app`;
}
export function patientLink(origin: string, code: string): string {
  return `${origin}/?clinic=${encodeURIComponent(code)}`;
}
