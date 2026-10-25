import manila from '@/assets/ads-manila.jpg';
import mall from '@/assets/ads-mall.jpg';
import sports from '@/assets/ads-sports.jpg';
import studio from '@/assets/ads-studio.jpg';
import type { Database } from '@/integrations/supabase/types';
export type AdListing = Database['public']['Tables']['ads_listings']['Row'];
export const adImages: Record<string, string> = { manila, mall, sports, studio };
export const adImage = (key?: string) => key?.startsWith('https://') ? key : adImages[key || 'manila'] || manila;
export const adCategories = ['Billboards & Outdoor Advertising','Digital LED Screens','Television Advertising','Radio Advertising','Mall Advertising','Transit Advertising','Event Sponsorships','Sports Sponsorships','Influencer & Creator Marketing','Digital & Online Advertising','Print Advertising','Brand Activations & Pop-Ups'];
export const adLocations = ['Metro Manila','Cebu','Davao','Pampanga','Nationwide'];
export const adAudiences = ['General public','Commuters','Professionals','Families','Shoppers','Sports fans','Young adults'];
export const peso = (value: number | null) => value === null ? 'Request quote' : new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
export function adsHead(title: string, description: string) { return {meta:[{title:`${title} — PSG Ads Marketplace`},{name:'description',content:description},{property:'og:title',content:`${title} — PSG Ads Marketplace`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}; }
