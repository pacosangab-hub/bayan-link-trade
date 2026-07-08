// Notification bell dropdown for AppShell header — role-aware.
import { Link } from "@tanstack/react-router";
import { Bell, MessageSquare, FileText, ShieldAlert, Package, Sparkles, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDemoRole } from "@/lib/demo/session";
import {
  useNotificationsForRole, useUnreadCount, markRead, markAllRead,
  type Notification, type NotifKind,
} from "@/lib/demo/notifications";

const iconFor = (k: NotifKind) => {
  switch (k) {
    case "message": return <MessageSquare size={14} />;
    case "custom_request": return <FileText size={14} />;
    case "custom_offer": return <Sparkles size={14} />;
    case "order": return <Package size={14} />;
    case "escrow": return <Package size={14} />;
    case "dispute": return <ShieldAlert size={14} />;
    default: return <Bell size={14} />;
  }
};

export function NotificationBell() {
  const role = useDemoRole();
  const list = useNotificationsForRole(role);
  const count = useUnreadCount(role);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded hover:bg-muted relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold grid place-items-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[360px] max-w-[92vw] bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Notifications <span className="text-xs text-muted-foreground">· {role}</span></div>
            <button
              onClick={() => markAllRead(role)}
              className="text-[11px] text-primary font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {list.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</div>
            )}
            {list.map((n) => (
              <NotifRow key={n.id} n={n} onClick={() => { markRead(n.id); setOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  const inner = (
    <div className={`px-3 py-2.5 border-b flex gap-2.5 hover:bg-muted/50 ${n.read ? "opacity-70" : ""}`}>
      <div className={`shrink-0 size-7 rounded-full grid place-items-center mt-0.5 ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
        {iconFor(n.kind)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-semibold truncate">{n.title}</div>
          <div className="text-[10px] text-muted-foreground shrink-0">{n.at}</div>
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
      </div>
      {!n.read && <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
    </div>
  );
  if (n.href) return <Link to={n.href} onClick={onClick} className="block">{inner}</Link>;
  return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
}
