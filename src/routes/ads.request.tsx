import { createFileRoute } from '@tanstack/react-router';
import { AdsShell } from '@/components/ads/AdsShell';
import { RequestForm } from '@/components/ads/RequestForm';
import { adsHead } from '@/lib/ads/catalog';
export const Route=createFileRoute('/ads/request')({head:()=>adsHead('Request advertising quotations','Tell Philippine media owners about your advertising objectives, audience, dates and budget.'),component:()=> <AdsShell><div className="max-w-2xl mx-auto px-4 py-10"><p className="text-xs text-primary font-semibold mb-2 uppercase">Advertising RFQ center</p><h1 className="text-4xl mb-6">Plan your next campaign</h1><RequestForm/></div></AdsShell>});
