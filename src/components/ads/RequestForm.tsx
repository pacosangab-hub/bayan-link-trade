import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate, Link } from '@tanstack/react-router';
import { createAdsRequest } from '@/lib/ads/functions';
import { adCategories, adAudiences, adLocations, type AdListing } from '@/lib/ads/catalog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';
import { toast } from 'sonner';
export const fieldClass='w-full bg-background border rounded-md px-3 py-2 text-sm min-h-10';
export function Field({label,children}:{label:string;children:React.ReactNode}) {return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;}
export function RequestForm({listing}:{listing?:AdListing}) {
 const {user}=useAuth();const send=useServerFn(createAdsRequest);const navigate=useNavigate();const [busy,setBusy]=useState(false);
 if(!user||user.source==='demo') return <div className="py-5"><p className="text-muted-foreground mb-4">Sign in with your PSG account to send an advertising request.</p><Button asChild><Link to="/login" search={{redirect:listing?`/ads/${listing.id}`:'/ads/request'}}>Sign in</Link></Button></div>;
 return <form className="space-y-4" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);try{await send({data:{listing_id:listing?.id||null,objective:String(f.get('objective')),audience:String(f.get('audience')),locations:String(f.get('locations')),channels:listing?[listing.category]:f.getAll('channels').map(String),budget:Number(f.get('budget')),start_date:String(f.get('start')),end_date:String(f.get('end')),requirements:String(f.get('requirements'))}});toast.success('Advertising request sent');navigate({to:'/ads/dashboard'});}catch(err){toast.error(err instanceof Error?err.message:'Request failed');}finally{setBusy(false);}}}>
 {listing?.is_demo&&<p className="bg-warning/10 text-warning-foreground p-3 text-sm rounded-md">Demo inventory: your request is saved, but no real media owner is assigned and no booking or payment is available.</p>}
 <Field label="Advertising objective"><input name="objective" required minLength={3} placeholder="e.g. Launch our new store" className={fieldClass}/></Field>
 <div className="grid sm:grid-cols-2 gap-4"><Field label="Target audience"><select name="audience" className={fieldClass}>{adAudiences.map(a=><option key={a}>{a}</option>)}</select></Field><Field label="Preferred location"><select name="locations" defaultValue={listing?.location} className={fieldClass}>{adLocations.map(a=><option key={a}>{a}</option>)}</select></Field></div>
 {!listing&&<fieldset><legend className="text-sm font-medium mb-2">Advertising channels</legend><div className="grid sm:grid-cols-2 gap-2">{adCategories.map(c=><label key={c} className="flex gap-2 text-xs items-center"><input type="checkbox" name="channels" value={c} defaultChecked={c===adCategories[0]}/>{c}</label>)}</div></fieldset>}
 <Field label="Campaign budget (PHP)"><input name="budget" type="number" min="1" required defaultValue={listing?.price||''} className={fieldClass}/></Field>
 <div className="grid grid-cols-2 gap-4"><Field label="Campaign start"><input name="start" type="date" required className={fieldClass}/></Field><Field label="Campaign end"><input name="end" type="date" required className={fieldClass}/></Field></div>
 <Field label="Special requirements"><textarea name="requirements" className={fieldClass} rows={3}/></Field><Button disabled={busy} className="w-full" type="submit">{busy?'Sending…':'Send advertising RFQ'}</Button></form>;
}
