import { createFileRoute } from "@tanstack/react-router";
import { Check, Upload, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/verification")({
  component: VerificationPage,
});

const docs = [
  { name: "DTI Business Registration", uploaded: true },
  { name: "BIR Certificate of Registration", uploaded: true },
  { name: "Mayor's / Business Permit", uploaded: true },
  { name: "FDA License to Operate", uploaded: true },
  { name: "Proof of Bank Account", uploaded: false },
  { name: "Authorized Signatory ID", uploaded: false },
];

function VerificationPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-success" />
          <div>
            <div className="font-semibold">Verification Status: Gold Supplier</div>
            <div className="text-xs text-muted-foreground">All core documents verified. Escrow-ready.</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Business Profile</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <Row label="Legal name" value="Bulacan Grain & Rice Mills Inc." />
          <Row label="Business type" value="Manufacturer" />
          <Row label="Location" value="Malolos, Bulacan" />
          <Row label="Years operating" value="14 years" />
          <Row label="Rating" value="4.8 ★" />
          <Row label="Completed orders" value="1,840" />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Documents Checklist</h3>
        <div className="divide-y">
          {docs.map((d) => (
            <div key={d.name} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                {d.uploaded ? (
                  <span className="size-6 rounded-full bg-success text-white grid place-items-center"><Check size={14} /></span>
                ) : (
                  <span className="size-6 rounded-full bg-muted grid place-items-center text-muted-foreground text-xs">—</span>
                )}
                {d.name}
              </div>
              {d.uploaded ? (
                <span className="chip chip-verified">Uploaded</span>
              ) : (
                <button className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border font-semibold">
                  <Upload size={12} /> Upload
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-semibold text-sm">
        Submit for Verification
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
