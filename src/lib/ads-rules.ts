export const ADS_PAYMENT_COLLECTION_ENABLED = false;
export const ADS_ESCROW_OPERATIONAL = false;
export const ADS_BOOKING_STAGES = ['inquiry', 'quotation', 'negotiation', 'booking_confirmed', 'payment_pending', 'campaign_active', 'completed'] as const;
export function canBookAds(listing: { is_demo: boolean; instant_booking: boolean; status: string }) {
  return !listing.is_demo && listing.instant_booking && listing.status === 'active';
}
export function validCampaignDates(start: string, end: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && end >= start;
}