import { describe, it, expect } from 'vitest';
import { ADS_PAYMENT_COLLECTION_ENABLED, ADS_ESCROW_OPERATIONAL, canBookAds, validCampaignDates } from './ads-rules';
describe('Advertising safety', () => {
  it('does not collect payments without a configured integration', () => expect(ADS_PAYMENT_COLLECTION_ENABLED).toBe(false));
  it('does not claim an operational escrow service', () => expect(ADS_ESCROW_OPERATIONAL).toBe(false));
  it('prevents booking demonstration inventory', () => expect(canBookAds({is_demo:true,instant_booking:true,status:'active'})).toBe(false));
  it('allows approved real instant-booking inventory', () => expect(canBookAds({is_demo:false,instant_booking:true,status:'active'})).toBe(true));
  it('rejects reversed campaign dates', () => expect(validCampaignDates('2026-12-10','2026-12-01')).toBe(false));
});