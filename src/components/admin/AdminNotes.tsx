import { useState } from "react";
import { addAdminNote, useAdminNotes, useAuditLogs } from "@/lib/admin/demo";
import type { AdminNote } from "@/lib/admin/demo";

export function AdminNotesPanel({ relatedType, relatedId }: { relatedType: AdminNote["relatedType"]; relatedId: string }) {
  const notes = useAdminNotes(relatedType, relatedId);
  const [text, setText] = useState("");
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-2.5 border-b font-semibold text-sm">Admin Notes <span className="text-xs text-muted-foreground font-normal">(private)</span></div>
      <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
        {notes.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No admin notes yet.</div>}
        {notes.map((n) => (
          <div key={n.id} className="rounded bg-muted/50 p-2.5 text-sm">
            <div className="text-xs text-muted-foreground mb-0.5">{n.createdBy} · {n.createdAt}</div>
            <div>{n.note}</div>
          </div>
        ))}
      </div>
      <div className="border-t p-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add internal note…"
          className="flex-1 bg-card border rounded px-2 py-1.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              addAdminNote({ relatedType, relatedId, note: text.trim() });
              setText("");
            }
          }}
        />
        <button
          onClick={() => {
            if (!text.trim()) return;
            addAdminNote({ relatedType, relatedId, note: text.trim() });
            setText("");
          }}
          className="rounded bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function AuditLogPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const logs = useAuditLogs(entityType, entityId);
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-2.5 border-b font-semibold text-sm">Audit Log</div>
      <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
        {logs.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No admin actions recorded.</div>}
        {logs.map((l) => (
          <div key={l.id} className="text-xs border-l-2 border-primary/60 pl-2 py-1">
            <div className="font-medium">{l.action}</div>
            <div className="text-muted-foreground">
              {l.adminUser} · {l.timestamp}
              {l.previousStatus && ` · ${l.previousStatus} → ${l.newStatus}`}
              {!l.previousStatus && l.newStatus && ` · ${l.newStatus}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
