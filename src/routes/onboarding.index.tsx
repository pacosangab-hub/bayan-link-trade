import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, patchAuthUser, defaultPortalFor, type AuthRole } from "@/lib/auth-store";
import { CheckCircle2, UserCog, Store, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({ meta: [{ title: "Get Started — PSG" }] }),
  component: OnboardingPage,
});

type Step = 1 | 2 | 3 | 4;

type AccountType = "buyer" | "supplier" | "both";

const BUSINESS_TYPES = [
  "Restaurant / Carinderia",
  "Café / Milk Tea / Beverage Shop",
  "Sari-sari Store",
  "Grocery / Mini Mart",
  "Hotel / Hospitality",
  "Commissary / Cloud Kitchen",
  "Manufacturer",
  "Distributor",
  "Wholesaler",
  "Farmer / Co-op",
  "Packaging Supplier",
  "Logistics Provider",
  "Other",
];

const REGIONS = ["NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B",
  "Region V", "Region VI", "Region VII", "Region VIII", "Region IX", "Region X", "Region XI",
  "Region XII", "Region XIII", "BARMM"];

const BUYER_PRODUCT_CHIPS = [
  "Rice & Grains", "Meat & Frozen Food", "Coffee & Café Supplies", "Packaging",
  "Cleaning Supplies", "Beverages", "Condiments & Sauces", "Bakery Ingredients",
  "Fresh Produce", "Eggs & Dairy", "Hotel Supplies", "Office Supplies",
];
const BUYER_FREQ = ["Daily", "Weekly", "Every 2 weeks", "Monthly", "As needed"];
const BUYER_SIZE = ["Under ₱5,000", "₱5,000–₱25,000", "₱25,000–₱100,000", "₱100,000+"];
const BUYER_PROBLEMS = [
  "Hard to find suppliers", "Prices are unclear", "Suppliers reply slowly",
  "Need better bulk pricing", "Worry about fake suppliers", "Delivery unreliable",
  "Need credit terms", "Need recurring supply",
];

const SUPPLIER_TYPES = [
  "Manufacturer", "Distributor", "Wholesaler", "Farmer / Co-op", "Importer",
  "Packaging Supplier", "Logistics Provider", "Service Provider",
];
const SUPPLIER_CATEGORIES = [
  "Food & FMCG", "Agriculture & Fresh Produce", "Packaging", "Coffee & Café Supplies",
  "Cleaning & Hygiene", "Beverages", "Construction Materials", "Hotel & Restaurant Supplies",
  "Pharma & Health", "Personal Care & Cosmetics", "Office Supplies", "Logistics",
];
const SERVICE_AREAS = ["NCR", "Bulacan", "Pampanga", "Cavite", "Laguna", "Rizal", "Batangas", "Cebu", "Davao", "Nationwide"];
const MOQ_RANGES = ["Low MOQ", "Medium MOQ", "Bulk MOQ", "Pallet / Container", "Made to order"];
const DELIVERY_CAP = ["Buyer pickup only", "Supplier delivery", "Third-party logistics", "Same-day possible", "1–3 days", "3–7 days", "Made to order"];

function OnboardingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const [accountType, setAccountType] = useState<AccountType>(
    user?.role === "supplier" ? "supplier" : user?.role === "both" ? "both" : "buyer"
  );

  // Step 2
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("NCR");
  const [contactPerson, setContactPerson] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [bizEmail, setBizEmail] = useState(user?.email || "");

  // Step 3 buyer
  const [buyerProducts, setBuyerProducts] = useState<string[]>([]);
  const [buyerFreq, setBuyerFreq] = useState(BUYER_FREQ[1]);
  const [buyerSize, setBuyerSize] = useState(BUYER_SIZE[1]);
  const [buyerProblems, setBuyerProblems] = useState<string[]>([]);

  // Step 3 supplier
  const [supplierType, setSupplierType] = useState(SUPPLIER_TYPES[0]);
  const [supplierCats, setSupplierCats] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [moqRange, setMoqRange] = useState(MOQ_RANGES[1]);
  const [deliveryCap, setDeliveryCap] = useState<string[]>([]);
  const [canInvoice, setCanInvoice] = useState("Yes");
  const [protectedPayments, setProtectedPayments] = useState("Yes");

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
  }, [isAuthenticated]);

  const showBuyer = accountType === "buyer" || accountType === "both";
  const showSupplier = accountType === "supplier" || accountType === "both";

  const totalSteps: Step = 4;
  const stepLabels = useMemo(() => ({
    1: "Choose account type",
    2: "Business profile",
    3: showBuyer && showSupplier ? "Buyer + Supplier setup" : showSupplier ? "Supplier setup" : "Buyer setup",
    4: "You're ready to go",
  }), [showBuyer, showSupplier]);

  if (!user) return null;

  function toggleChip(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function goStep1(next: AccountType) {
    setAccountType(next);
    setStep(2);
  }

  function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  function submitStep3(e: React.FormEvent) {
    e.preventDefault();
    setStep(4);
  }

  function finishAll() {
    const nextRole: AuthRole = accountType === "both" ? "both" : accountType;
    patchAuthUser({
      role: nextRole,
      businessName,
      onboardingCompleted: true,
    });
    // Store extra onboarding data locally so admin/portals can use it later.
    try {
      localStorage.setItem("psg_onboarding_profile", JSON.stringify({
        accountType, businessName, businessType, industry, location, region,
        contactPerson, phone, bizEmail,
        buyer: showBuyer ? { buyerProducts, buyerFreq, buyerSize, buyerProblems } : null,
        supplier: showSupplier ? { supplierType, supplierCats, serviceAreas, moqRange, deliveryCap, canInvoice, protectedPayments } : null,
      }));
    } catch { /* noop */ }
    toast.success("You're all set!");
    navigate({ to: defaultPortalFor(nextRole), replace: true });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>
        <h1 className="font-display text-3xl mt-2">{stepLabels[step]}</h1>

        {step === 1 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Choose how your business will use Philippine Supply Gateway.</p>
            <div className="grid gap-3">
              <TypeCard
                icon={<UserCog size={20} />}
                title="Buyer"
                text="Find suppliers, request quotes, place protected orders, and reorder supplies."
                selected={accountType === "buyer"}
                onClick={() => goStep1("buyer")}
              />
              <TypeCard
                icon={<Store size={20} />}
                title="Supplier"
                text="List products, receive buyer requests, send offers, and manage orders."
                selected={accountType === "supplier"}
                onClick={() => goStep1("supplier")}
              />
              <TypeCard
                icon={<Users size={20} />}
                title="Buyer + Supplier"
                text="Buy and sell through one business account."
                selected={accountType === "both"}
                onClick={() => goStep1("both")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submitStep2} className="mt-6 space-y-4 bg-card border rounded-lg p-6">
            <Field label="Business name"><input required className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Business type">
                <select className="input" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  {BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Industry"><input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Food Service" /></Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Location (city)"><input required className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
              <Field label="Region">
                <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact person"><input required className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></Field>
              <Field label="Contact number"><input required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            </div>
            <Field label="Business email"><input type="email" required className="input" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} /></Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border rounded-md py-2.5 font-semibold">Back</button>
              <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold rounded-md py-2.5">Continue</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitStep3} className="mt-6 space-y-6 bg-card border rounded-lg p-6">
            {showBuyer && (
              <section className="space-y-4">
                <h2 className="font-semibold">What do you usually buy?</h2>
                <ChipGroup label="Product categories" options={BUYER_PRODUCT_CHIPS} value={buyerProducts} onToggle={(v) => toggleChip(buyerProducts, v, setBuyerProducts)} />
                <RadioGroup label="Buying frequency" options={BUYER_FREQ} value={buyerFreq} onChange={setBuyerFreq} />
                <RadioGroup label="Usual order size" options={BUYER_SIZE} value={buyerSize} onChange={setBuyerSize} />
                <ChipGroup label="Biggest sourcing problem" options={BUYER_PROBLEMS} value={buyerProblems} onToggle={(v) => toggleChip(buyerProblems, v, setBuyerProblems)} />
              </section>
            )}
            {showBuyer && showSupplier && <hr />}
            {showSupplier && (
              <section className="space-y-4">
                <h2 className="font-semibold">What do you sell?</h2>
                <RadioGroup label="Supplier type" options={SUPPLIER_TYPES} value={supplierType} onChange={setSupplierType} />
                <ChipGroup label="Main categories" options={SUPPLIER_CATEGORIES} value={supplierCats} onToggle={(v) => toggleChip(supplierCats, v, setSupplierCats)} />
                <ChipGroup label="Service areas" options={SERVICE_AREAS} value={serviceAreas} onToggle={(v) => toggleChip(serviceAreas, v, setServiceAreas)} />
                <RadioGroup label="Minimum order range" options={MOQ_RANGES} value={moqRange} onChange={setMoqRange} />
                <ChipGroup label="Delivery capability" options={DELIVERY_CAP} value={deliveryCap} onToggle={(v) => toggleChip(deliveryCap, v, setDeliveryCap)} />
                <div className="grid md:grid-cols-2 gap-4">
                  <RadioGroup label="Can issue invoice?" options={["Yes", "No", "Depends on order"]} value={canInvoice} onChange={setCanInvoice} />
                  <RadioGroup label="Open to protected payments?" options={["Yes", "No", "Not sure yet"]} value={protectedPayments} onChange={setProtectedPayments} />
                </div>
              </section>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border rounded-md py-2.5 font-semibold">Back</button>
              <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold rounded-md py-2.5">Continue</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="mt-6 space-y-6 bg-card border rounded-lg p-6">
            <div className="text-center">
              <div className="size-14 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-display text-2xl mt-4">You're ready to use PSG</h2>
              <p className="text-muted-foreground mt-1">Here's a quick summary — you can edit anything from Settings later.</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm bg-muted/30 rounded-md p-4">
              <Info label="Account type" value={accountType === "both" ? "Buyer + Supplier" : accountType[0].toUpperCase() + accountType.slice(1)} />
              <Info label="Business name" value={businessName || "—"} />
              <Info label="Region" value={region} />
              <Info label="Location" value={location || "—"} />
              {showBuyer && <Info label="Buyer categories" value={buyerProducts.slice(0, 3).join(", ") || "—"} />}
              {showSupplier && <Info label="Supplier categories" value={supplierCats.slice(0, 3).join(", ") || "—"} />}
            </dl>
            <div className="grid sm:grid-cols-2 gap-2">
              <button onClick={finishAll} className="bg-primary text-primary-foreground font-semibold rounded-md py-2.5">
                {accountType === "supplier" ? "Go to Supplier Portal" : "Go to Buyer Portal"}
              </button>
              <button
                onClick={() => {
                  patchAuthUser({
                    role: accountType === "both" ? "both" : accountType,
                    businessName,
                    onboardingCompleted: true,
                  });
                  navigate({ to: accountType === "supplier" ? "/supplier-portal/products/new" : "/rfq/new" });
                }}
                className="border rounded-md py-2.5 font-semibold"
              >
                {accountType === "supplier" ? "Add First Product" : accountType === "both" ? "Go to Supplier Portal" : "Post First Quote Request"}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-sm font-semibold mb-1">{label}</div>{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function TypeCard({ icon, title, text, selected, onClick }: {
  icon: React.ReactNode; title: string; text: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border rounded-lg p-4 hover:border-primary transition-colors ${selected ? "border-primary bg-primary/5" : "bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{text}</div>
        </div>
      </div>
    </button>
  );
}

function ChipGroup({ label, options, value, onToggle }: {
  label: string; options: string[]; value: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                on ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              value === o ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
