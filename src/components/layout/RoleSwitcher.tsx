// Role switcher — small pill in header for demo mode.
import { UserCog, ShieldCheck, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { setRole, useDemoRole, type DemoRole } from "@/lib/demo/session";

const OPTIONS: { value: DemoRole; label: string; icon: JSX.Element; hint: string }[] = [
  { value: "buyer", label: "View as Buyer", icon: <UserCog size={14} />, hint: "Lola Nena's Carinderia Group" },
  { value: "supplier", label: "View as Supplier", icon: <Store size={14} />, hint: "Bulacan Grain & Rice Mills" },
  { value: "admin", label: "View as Admin", icon: <ShieldCheck size={14} />, hint: "PSG safety & escrow console" },
];

export function RoleSwitcher() {
  const role = useDemoRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const cur = OPTIONS.find((o) => o.value === role)!;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold hover:bg-muted"
        title="Switch demo role"
      >
        {cur.icon} <span className="capitalize">{role}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Demo mode</div>
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => { setRole(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-start gap-2 ${role === o.value ? "bg-primary/5" : ""}`}
            >
              <div className={`size-6 rounded grid place-items-center mt-0.5 ${role === o.value ? "bg-primary text-white" : "bg-muted text-foreground/70"}`}>
                {o.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs">{o.label}</div>
                <div className="text-[10px] text-muted-foreground">{o.hint}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
