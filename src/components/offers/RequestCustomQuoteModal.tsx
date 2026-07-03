import { useState } from "react";
import { X, Send, Paperclip, ShieldCheck } from "lucide-react";
import { createRequest } from "@/lib/offers-store";
import { industries } from "@/lib/industries";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  defaultProductName?: string;
  defaultCategory?: string;
  defaultUnit?: string;
  onCreated?: (id: string) => void;
};

export function RequestCustomQuoteModal({
  open, onClose, supplierId, defaultProductName = "", defaultCategory = "", defaultUnit = "units", onCreated,
}: Props) {
  const [productName, setProductName] = useState(defaultProductName);
  const [category, setCategory] = useState(defaultCategory);
  const [industry, setIndustry] = useState(industries[0].name);
  const [qty, setQty] = useState(100);
  const [unit, setUnit] = useState(defaultUnit);
  const [budget, setBudget] = useState(50000);
  const [deliveryLocation, setDeliveryLocation] = useState("Quezon City, Metro Manila");
  const [neededBy, setNeededBy] = useState("Within 14 days");
  const [recurring, setRecurring] = useState<"One-time" | "Weekly" | "Monthly" | "Custom">("One-time");
  const [requirements, setRequirements] = useState("");
  const [packaging, setPackaging] = useState("");
  const [certifications, setCertifications] = useState("");
  const [deliveryRequirements, setDeliveryRequirements] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  function submit() {
    if (!productName.trim()) { toast.error("Product name is required"); return; }
    const req = createRequest({
      buyer: "buyer_me",
      buyerBusiness: "Lola Nena's Carinderia Group",
      buyerType: "Carinderia chain",
      supplierId,
      productName, category, industry,
      qty, unit, budgetPhp: budget,
      deliveryLocation, neededBy, recurring,
      requirements, packaging, certifications,
      deliveryRequirements, message,
      attachments: [],
    });
    toast.success("Your request has been sent.", { description: "The supplier can now send you a custom offer." });
    onCreated?.(req.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Custom Offer · Supplier Proposal</div>
            <h2 className="font-display text-xl">Request a custom quote</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="p-5 grid gap-3 text-sm">
          <Field label="Product / service needed *">
            <input value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. Premium rice, 500 kg/month" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Category">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. Rice & Grains" />
            </Field>
            <Field label="Industry">
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full border rounded-md px-3 py-2 bg-card">
                {industries.map((i) => <option key={i.name}>{i.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Quantity"><input type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Unit"><input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="kg / boxes / units" /></Field>
            <Field label="Target budget (₱)"><input type="number" value={budget} onChange={(e) => setBudget(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Delivery location"><input value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Needed by"><input value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. Within 14 days" /></Field>
          </div>
          <Field label="Order type">
            <div className="flex flex-wrap gap-2">
              {(["One-time", "Weekly", "Monthly", "Custom"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setRecurring(k)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${recurring === k ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"}`}>
                  {k}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Custom requirements"><textarea rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Grade, spec, tolerance, colors, etc." /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Packaging requirements"><input value={packaging} onChange={(e) => setPackaging(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. 25 kg PP sack" /></Field>
            <Field label="Certifications / documents"><input value={certifications} onChange={(e) => setCertifications(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="FDA, HACCP, NFA, PS mark…" /></Field>
          </div>
          <Field label="Delivery requirements"><input value={deliveryRequirements} onChange={(e) => setDeliveryRequirements(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Chilled van / staggered / forklift" /></Field>
          <Field label="Message to supplier"><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
          <button type="button" className="text-xs text-muted-foreground inline-flex items-center gap-1.5 hover:text-primary self-start">
            <Paperclip size={14} /> Attach file / photo (demo)
          </button>
          <div className="rounded-md bg-success/10 text-success text-xs px-3 py-2 flex items-center gap-2">
            <ShieldCheck size={14} /> Escrow-protected. Funds released only after delivery confirmation.
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1.5">
            <Send size={14} /> Send Request
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
