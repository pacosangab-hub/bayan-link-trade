// Attachment menu opened from paperclip in composer.
import { FileText, Sparkles, Package, Paperclip, ShoppingBag } from "lucide-react";
import type { DemoRole } from "@/lib/demo/session";

type Item = { key: string; label: string; icon: JSX.Element; desc: string };

export function AttachmentMenu({ role, onPick, onClose }: {
  role: DemoRole;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const items: Item[] = role === "supplier"
    ? [
        { key: "custom_offer", label: "Send Custom Offer", icon: <Sparkles size={16} className="text-primary" />, desc: "Structured proposal with pricing & terms" },
        { key: "attach_product", label: "Attach Product", icon: <ShoppingBag size={16} />, desc: "Share a catalog item" },
        { key: "attach_quote", label: "Attach Quote", icon: <FileText size={16} />, desc: "Share an existing quote" },
        { key: "upload", label: "Upload File", icon: <Paperclip size={16} />, desc: "PDF, JPG, PNG, DOCX (demo)" },
      ]
    : [
        { key: "custom_request", label: "Send Custom Request", icon: <Sparkles size={16} className="text-primary" />, desc: "Ask supplier for a structured offer" },
        { key: "attach_product", label: "Attach Product", icon: <ShoppingBag size={16} />, desc: "Reference a product on PSG" },
        { key: "attach_order", label: "Attach Order", icon: <Package size={16} />, desc: "Reference an existing order" },
        { key: "upload", label: "Upload File", icon: <Paperclip size={16} />, desc: "PDF, JPG, PNG, DOCX (demo)" },
      ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 left-0 w-72 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b">
          {role === "supplier" ? "Supplier attachments" : "Buyer attachments"}
        </div>
        {items.map((i) => (
          <button
            key={i.key}
            onClick={() => { onPick(i.key); onClose(); }}
            className="w-full text-left px-3 py-2.5 hover:bg-muted flex gap-2.5 items-start border-b last:border-b-0"
          >
            <div className="size-8 rounded-md bg-muted grid place-items-center shrink-0">{i.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{i.label}</div>
              <div className="text-[10px] text-muted-foreground">{i.desc}</div>
            </div>
          </button>
        ))}
        <div className="px-3 py-2 text-[10px] text-muted-foreground bg-muted/40 border-t">
          Files are scanned and logged for safety in the real version.
        </div>
      </div>
    </>
  );
}
