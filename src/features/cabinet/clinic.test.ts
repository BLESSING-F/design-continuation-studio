import { describe, expect, it } from 'vitest';
import { clinicEmail, generateCode, isValidCode, normalizeCode, patientLink } from './clinic';

describe('clinic code', () => {
  it('normalizes typed codes', () => expect(normalizeCode(' ab-c2 3d ')).toBe('ABC23D'));
  it('generates valid 6-char codes', () => { for (let i = 0; i < 50; i++) expect(isValidCode(generateCode())).toBe(true); });
  it('rejects wrong length and ambiguous characters', () => { expect(isValidCode('ABC')).toBe(false); expect(isValidCode('ABCDE0')).toBe(false); });
  it('derives the same account for any typing of the code', () => expect(clinicEmail('abc23d')).toBe(clinicEmail(' ABC23D')));
  it('builds the patient link with the clinic', () => expect(patientLink('https://x.app', 'ABC23D')).toBe('https://x.app/?clinic=ABC23D'));
});
