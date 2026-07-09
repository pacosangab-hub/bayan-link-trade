import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { setRole, useDemoRole } from "@/lib/demo/session";
import { resetAllDemoData, updateReport, useReports } from "@/lib/demo/safety";

const verificationQueue = [
  { id: "biz_101", business: "North Luzon Chemical Traders", type: "Supplier", location: "Valenzuela", risk: "Restricted category docs needed", status: "Needs Review" },
  { id: "biz_102", business: "Bicol Seafood Export Coop", type: "Supplier", location: "Legazpi", risk: "Cold-chain certificate pending", status: "Needs Review" },
  { id: "biz_103", business: "Hotel Antonio Group", type: "Buyer", location: "Makati", risk: "Large recurring purchase", status: "Verified" },
];

export function DemoSafetyCenter() {
  const role = useDemoRole();
  const reports = useReports();
  const openReports = reports.filter((r) => r.status === "Open");

  function handleAction(id: string, status: "Dismissed" | "Actioned") {
    updateReport(id, { status });
    toast.success(status === "Actioned" ? "Safety action logged" : "Report dismissed");
  }

  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold font-bold">Demo admin</div>
            <h1 className="font-display text-3xl mt-1">Safety Center</h1>
            <p className="text-sm text-white/75 mt-2 max-w-2xl">
              Local demo queue for disputes, off-platform payment reports, supplier verification, and demo data reset.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role !== "admin" && (
              <button
                onClick={() => setRole("admin")}
                className="inline-flex items-center gap-2 rounded-md bg-white text-ink px-4 py-2 text-sm font-semibold hover:bg-white/90"
              >
                <ShieldCheck size={16} /> View as Admin
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Reset all local demo conversations, orders, offers, reports, notifications, and cart data?")) resetAllDemoData();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <RotateCcw size={16} /> Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Open reports" value={openReports.length} tone="warn" />
          <Metric label="Verification queue" value={verificationQueue.filter((q) => q.status === "Needs Review").length} />
          <Metric label="Demo role" value={role} />
          <Metric label="Local mode" value="Active" tone="safe" />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl">Reports & disputes</h2>
                <p className="text-xs text-muted-foreground">Reports submitted from Messages and Orders appear here instantly.</p>
              </div>
              <ShieldAlert className="text-destructive" size={22} />
            </div>
            <div className="divide-y">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No safety reports yet.</div>
              ) : reports.map((report) => (
                <div key={report.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`chip ${report.status === "Open" ? "chip-primary" : report.status === "Actioned" ? "chip-verified" : ""}`}>{report.status}</span>
                      <span className="font-semibold text-sm">{report.reason}</span>
                    </div>
                    <div className="mt-1 text-sm text-foreground">{report.targetLabel}</div>
                    <div className="text-xs text-muted-foreground">{report.createdAt} · {report.note}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleAction(report.id, "Actioned")}
                      disabled={report.status === "Actioned"}
                      className="inline-flex items-center gap-1 rounded-md bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Action
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "Dismissed")}
                      disabled={report.status === "Dismissed"}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/80 disabled:opacity-50"
                    >
                      <XCircle size={13} /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-xl">Restricted category review</h2>
              <p className="text-xs text-muted-foreground">Demo checks for controlled goods, certificates, and supplier trust.</p>
            </div>
            <div className="divide-y">
              {verificationQueue.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">{item.business}</div>
                      <div className="text-xs text-muted-foreground">{item.type} · {item.location}</div>
                    </div>
                    <span className={`chip ${item.status === "Verified" ? "chip-verified" : "chip-primary"}`}>{item.status}</span>
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" /> {item.risk}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-lg border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-sm">Need to test a safety report?</div>
            <div className="text-xs text-muted-foreground">Open Messages, click Report, submit a reason, then return here.</div>
          </div>
          <Link to="/messages" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Open Messages
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "safe" | "warn" }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-2 text-2xl font-display ${tone === "safe" ? "text-success" : tone === "warn" ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}