import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { adminQueue, formatPhp, suppliers } from "@/lib/mock-data";
import { ShieldCheck, AlertTriangle, Users, FileSearch, Activity } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — PSG" }] }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[oklch(0.78_0.15_75)] font-semibold">Admin console</div>
          <h1 className="font-display text-3xl">Trust & Operations</h1>
          <p className="text-sm text-white/70">Internal — verifications, disputes, fraud, GMV</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPI label="Active suppliers" value="54" hint="+6 this week" />
          <KPI label="Active buyers" value="312" hint="+41 this week" />
          <KPI label="30d GMV" value="₱4.28M" hint="+22% MoM" />
          <KPI label="Pending KYC" value={adminQueue.pendingVerifications.length.toString()} hint="Avg 9h review" warn />
          <KPI label="Open disputes" value={adminQueue.openDisputes.length.toString()} hint="0.4% of orders" warn />
        </div>

        {/* KYC queue */}
        <Panel icon={<FileSearch size={18} />} title="Verification queue">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Business</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Docs</th>
                  <th className="text-left py-2">Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {adminQueue.pendingVerifications.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="py-3 font-medium">{v.business}</td>
                    <td>{v.type}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {v.docs.map((d) => <span key={d} className="chip">{d}</span>)}
                      </div>
                    </td>
                    <td className="text-muted-foreground">{v.submitted}</td>
                    <td className="text-right space-x-2 py-3">
                      <button className="border rounded px-3 py-1 text-xs font-semibold">Review</button>
                      <button className="bg-success text-success-foreground rounded px-3 py-1 text-xs font-semibold">Approve</button>
                      <button className="border border-destructive text-destructive rounded px-3 py-1 text-xs font-semibold">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel icon={<AlertTriangle size={18} />} title="Open disputes">
            <div className="space-y-3">
              {adminQueue.openDisputes.map((d) => (
                <div key={d.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Order {d.order.toUpperCase()}</div>
                      <div className="font-medium">{d.buyer} vs. {d.supplier}</div>
                      <div className="text-sm text-muted-foreground">{d.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg text-primary">{formatPhp(d.amount)}</div>
                      <div className="text-xs text-muted-foreground">{d.opened}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 border rounded px-3 py-1.5 text-xs font-semibold">Investigate</button>
                    <button className="flex-1 bg-success text-success-foreground rounded px-3 py-1.5 text-xs font-semibold">Refund buyer</button>
                    <button className="flex-1 bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-semibold">Release to seller</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel icon={<ShieldCheck size={18} />} title="Fraud / risk flags">
            <div className="space-y-2">
              {adminQueue.flaggedAccounts.map((f) => (
                <div key={f.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">{f.account}</div>
                    <div className="text-xs text-muted-foreground">{f.reason}</div>
                  </div>
                  <span className={`chip ${f.risk === "High" ? "bg-destructive/15 text-destructive" : "chip-gold"}`}>
                    {f.risk} risk
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel icon={<Users size={18} />} title="Top suppliers by GMV">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {suppliers.slice(0, 4).map((s) => (
              <div key={s.id} className="border rounded-md p-3">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.location}</div>
                <div className="mt-2 font-display text-xl">₱{(s.transactions * 850).toLocaleString()}</div>
                <div className="text-xs text-success">{s.repeatBuyers} repeat buyers</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={<Activity size={18} />} title="Audit log">
          <ul className="text-sm divide-y">
            {[
              "09:12 — Approved KYC for Davao Cement & Hardware Corp.",
              "08:48 — Released ₱58,200 escrow for ord_23901",
              "Yesterday — Refunded ₱1,860 to Sunrise Pharmacy (dispute dsp_1)",
              "Yesterday — Flagged BestPrice Wholesale for chargebacks",
              "Jun 22 — New supplier joined: San Pablo Coconut Mills",
            ].map((l, i) => (
              <li key={i} className="py-2 text-muted-foreground"><span className="font-mono text-foreground mr-2">●</span>{l}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function KPI({ label, value, hint, warn }: any) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
      <div className={`text-xs mt-0.5 ${warn ? "text-warning" : "text-success"}`}>{hint}</div>
    </div>
  );
}
function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2">{icon} {title}</h2>
      {children}
    </div>
  );
}
