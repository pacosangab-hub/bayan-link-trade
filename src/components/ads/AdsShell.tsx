import { Link, useRouterState } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Megaphone, ArrowUpRight } from 'lucide-react';
export function AdsShell({children}:{children:React.ReactNode}) {
 const path=useRouterState({select:s=>s.location.pathname});
 return <AppShell><div className="border-b bg-card"><div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3"><Link to="/ads" className="flex items-center gap-2 font-display text-2xl"><Megaphone className="text-primary"/> PSG <span className="text-primary">ADS MARKETPLACE</span></Link><nav className="flex flex-wrap items-center gap-1"><Button asChild variant={path==='/ads'?'secondary':'ghost'}><Link to="/ads">Explore</Link></Button><Button asChild variant={path.includes('dashboard')?'secondary':'ghost'}><Link to="/ads/dashboard">My campaigns</Link></Button><Button asChild variant="outline"><Link to="/ads/new">List advertising space <ArrowUpRight/></Link></Button></nav></div></div>{children}</AppShell>;
}
