import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { conversations } from "@/lib/mock-data";
import { useState } from "react";
import { Send, Paperclip, Search } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — PSG" }] }),
  component: Messages,
});

function Messages() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const active = conversations.find((c) => c.id === activeId)!;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="font-display text-3xl mb-4">Messages</h1>
        <div className="grid md:grid-cols-[320px_1fr] gap-0 border rounded-lg overflow-hidden bg-card min-h-[600px]">
          {/* List */}
          <aside className="border-r flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full bg-muted/60 rounded-md pl-9 pr-3 py-2 text-sm" placeholder="Search conversations" />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 ${activeId === c.id ? "bg-muted/70" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate">{c.with}</div>
                    {c.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] size-5 rounded-full grid place-items-center font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.withRole}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">{c.lastMessage}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Thread */}
          <div className="flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{active.with}</div>
                <div className="text-xs text-muted-foreground">{active.withRole} · usually replies in 2 hrs</div>
              </div>
              <button className="text-xs border rounded-md px-3 py-1.5 font-semibold">View profile</button>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-muted/30 space-y-3">
              <div className="rounded-md bg-warning/15 text-warning-foreground px-3 py-2 text-xs text-center">
                🛡 All conversations are logged. Pay only through PSG escrow.
              </div>
              {active.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      m.from === "me"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border rounded-bl-sm"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 ${m.from === "me" ? "text-white/70" : "text-muted-foreground"}`}>{m.at}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-3 flex items-center gap-2">
              <button className="p-2 rounded hover:bg-muted"><Paperclip size={18} /></button>
              <input className="flex-1 border rounded-md px-3 py-2 text-sm" placeholder="Write a message..." />
              <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
