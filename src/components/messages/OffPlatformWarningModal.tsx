// Warning modal shown when message contains off-platform payment keywords.
import { AlertTriangle, X } from "lucide-react";

export function OffPlatformWarningModal({ keyword, onContinue, onCancel }: {
  keyword: string;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-card rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2 text-warning font-semibold">
            <AlertTriangle size={18} /> Safety warning
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
        </div>
        <div className="p-5 text-sm space-y-3">
          <p>Your message mentions <span className="font-semibold">"{keyword}"</span>, which sounds like an off-platform payment.</p>
          <p className="text-muted-foreground">
            Paying outside PSG escrow removes buyer protection. PSG cannot recover funds sent to personal accounts,
            bank transfers, or e-wallets outside our platform.
          </p>
          <div className="rounded-md bg-warning/10 text-warning-foreground text-xs px-3 py-2">
            This message will be logged and flagged for review.
          </div>
        </div>
        <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button onClick={onContinue} className="px-4 py-2 text-sm rounded-md bg-warning text-warning-foreground font-semibold">
            Send anyway
          </button>
        </div>
      </div>
    </div>
  );
}
