import { describe, expect, it } from 'vitest';
import { residentialDetailsSchema, requestPhotosSchema } from './requestSchemas';
import { emptyResidentialDetails } from '../types/request';

const valid = { ...emptyResidentialDetails(), propertyType: 'APARTMENT', areaSqft: '750', hasPets: false };
describe('residential validation', () => {
  it('requires an explicit property, area and pets choice', () => {
    expect(residentialDetailsSchema.safeParse(emptyResidentialDetails()).success).toBe(false);
    expect(residentialDetailsSchema.safeParse(valid).success).toBe(true);
    for (const patch of [{ propertyType: '' }, { areaSqft: '' }, { hasPets: null }]) {
      expect(residentialDetailsSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
  it('allows studios and decimal areas while rejecting invalid dimensions', () => {
    expect(residentialDetailsSchema.safeParse({ ...valid, bedrooms: 0, areaSqft: '750,5' }).success).toBe(true);
    for (const patch of [{ bedrooms: -1 }, { bathrooms: 0 }, { floors: 1.5 }, { areaSqft: '0' }, { areaSqft: '-10' }, { areaSqft: 'Infinity' }, { description: 'a'.repeat(501) }]) {
      expect(residentialDetailsSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
  it('allows optional photos but never more than five', () => {
    expect(requestPhotosSchema.safeParse([]).success).toBe(true);
    const photos = Array.from({ length: 6 }, (_, i) => ({ id: String(i), uri: `file:///${i}.jpg`, name: `${i}.jpg` }));
    expect(requestPhotosSchema.safeParse(photos.slice(0, 5)).success).toBe(true);
    expect(requestPhotosSchema.safeParse(photos).success).toBe(false);
  });
});
