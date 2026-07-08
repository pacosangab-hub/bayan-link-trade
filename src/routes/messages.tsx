import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Paperclip, Search, ShieldAlert, ShieldCheck, Flag } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  useConversations, useConversation, sendText, attachCard, markConversationRead,
  getOrCreateWithSupplier, containsOffPlatform, type Conversation, type ChatMessage,
} from "@/lib/demo/messages";
import { useDemoRole, type DemoRole } from "@/lib/demo/session";
import { supplierById, productById } from "@/lib/mock-data";
import { AttachmentMenu } from "@/components/messages/AttachmentMenu";
import { CustomRequestCard } from "@/components/messages/CustomRequestCard";
import { CustomOfferCard } from "@/components/messages/CustomOfferCard";
import { OrderCreatedCard } from "@/components/messages/OrderCreatedCard";
import { OffPlatformWarningModal } from "@/components/messages/OffPlatformWarningModal";
import { ReportModal } from "@/components/messages/ReportModal";
import { RequestCustomQuoteModal } from "@/components/offers/RequestCustomQuoteModal";
import { SendCustomOfferModal } from "@/components/offers/SendCustomOfferModal";
import { RequestChangesModal } from "@/components/offers/RequestChangesModal";
import {
  useOffer, useRequest, acceptOffer, rejectOffer, updateRequest,
} from "@/lib/offers-store";
import { pushNotification } from "@/lib/demo/notifications";

const searchSchema = z.object({
  supplier: z.string().optional(),
  intent: z.enum(["request", "message"]).optional(),
  productId: z.string().optional(),
});

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — PSG" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Messages,
});

function Messages() {
  const role = useDemoRole();
  const search = useSearch({ from: "/messages" });
  const conversations = useConversations();
  const [activeId, setActiveId] = useState<string | undefined>(conversations[0]?.id);

  // deep-link: /messages?supplier=sup_001&intent=request&productId=...
  const [autoOpenRequest, setAutoOpenRequest] = useState(false);
  const [autoProduct, setAutoProduct] = useState<string | undefined>();
  useEffect(() => {
    if (search.supplier) {
      const c = getOrCreateWithSupplier(search.supplier);
      setActiveId(c.id);
      if (search.intent === "request") {
        setAutoOpenRequest(true);
        setAutoProduct(search.productId);
      }
    }
  }, [search.supplier, search.intent, search.productId]);

  const active = useConversation(activeId);
  useEffect(() => {
    if (activeId && active) markConversationRead(activeId, role === "supplier" ? "supplier" : "buyer");
  }, [activeId, active?.messages.length, role]);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-end justify-between mb-4">
          <h1 className="font-display text-3xl">Messages</h1>
          <div className="text-xs text-muted-foreground">
            Acting as <span className="font-semibold capitalize text-foreground">{role}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-[320px_1fr] gap-0 border rounded-lg overflow-hidden bg-card min-h-[600px]">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onPick={setActiveId}
            role={role}
          />
          {active ? (
            <ChatPanel
              key={active.id}
              conv={active}
              role={role}
              openRequestModal={autoOpenRequest}
              consumeAutoOpen={() => setAutoOpenRequest(false)}
              autoProductId={autoProduct}
            />
          ) : (
            <div className="grid place-items-center text-muted-foreground text-sm p-10">
              Start a conversation from a supplier profile or product page.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------- Left: list ----------
function ConversationList({ conversations, activeId, onPick, role }: {
  conversations: Conversation[];
  activeId: string | undefined;
  onPick: (id: string) => void;
  role: DemoRole;
}) {
  const [q, setQ] = useState("");
  const filtered = conversations.filter((c) =>
    (role === "supplier" ? c.buyerBusiness : c.supplierName).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <aside className="border-r flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full bg-muted/60 rounded-md pl-9 pr-3 py-2 text-sm"
            placeholder="Search conversations"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">No conversations.</div>
        )}
        {filtered.map((c) => {
          const unread = role === "supplier" ? c.unreadForSupplier : c.unreadForBuyer;
          const name = role === "supplier" ? c.buyerBusiness : c.supplierName;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 ${activeId === c.id ? "bg-muted/70" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm truncate">{name}</div>
                {unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] size-5 rounded-full grid place-items-center font-bold">
                    {unread}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {role === "supplier" ? "Buyer" : "Supplier"} · {c.updatedAt}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-1">{c.lastMessage || "No messages yet"}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ---------- Right: chat panel ----------
function ChatPanel({ conv, role, openRequestModal, consumeAutoOpen, autoProductId }: {
  conv: Conversation;
  role: DemoRole;
  openRequestModal: boolean;
  consumeAutoOpen: () => void;
  autoProductId?: string;
}) {
  const supplier = supplierById(conv.supplierId);
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerFromReq, setOfferFromReq] = useState<string | undefined>();
  const [reviseOfferId, setReviseOfferId] = useState<string | undefined>();
  const [showReport, setShowReport] = useState(false);
  const [showChanges, setShowChanges] = useState<string | undefined>();
  const [flagged, setFlagged] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv.messages.length]);

  useEffect(() => {
    if (openRequestModal) {
      setShowRequest(true);
      consumeAutoOpen();
    }
  }, [openRequestModal, consumeAutoOpen]);

  const meRole: "buyer" | "supplier" = role === "supplier" ? "supplier" : "buyer";
  const headerName = role === "supplier" ? conv.buyerBusiness : conv.supplierName;
  const productDefault = autoProductId ? productById(autoProductId) : undefined;

  function trySend() {
    const t = text.trim();
    if (!t) return;
    const kw = containsOffPlatform(t);
    if (kw) { setFlagged(kw); return; }
    sendText(conv.id, meRole, t);
    setText("");
  }
  function forceSend() {
    if (flagged) {
      sendText(conv.id, meRole, text.trim(), true);
      setText("");
      setFlagged(null);
    }
  }

  function pickAttachment(key: string) {
    if (key === "custom_request") setShowRequest(true);
    else if (key === "custom_offer") setShowOffer(true);
    else toast("Attachment placeholder — demo only");
  }

  function acceptOfferInChat(offerId: string) {
    if (!confirm("Accept this custom offer? An order will be created.")) return;
    const order = acceptOffer(offerId);
    if (!order) { toast.error("Could not create order"); return; }
    attachCard(conv.id, "system", "order_created", { orderId: order.id }, `Order ${order.id.toUpperCase()} created`);
    pushNotification({
      role: "supplier", kind: "order",
      title: `Buyer accepted your offer`,
      body: `Order ${order.id.toUpperCase()} · escrow funded.`,
      href: `/orders/${order.id}`,
    });
    pushNotification({
      role: "buyer", kind: "order",
      title: `Order ${order.id.toUpperCase()} created`,
      body: `Escrow funded. Supplier will start preparing.`,
      href: `/orders/${order.id}`,
    });
    toast.success("Offer accepted & order created");
  }

  function rejectOfferInChat(offerId: string) {
    rejectOffer(offerId);
    sendText(conv.id, "system", "Buyer rejected the offer.");
  }

  return (
    <div className="flex flex-col">
      <div className="border-b p-4 flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold flex items-center gap-2">
            {headerName}
            {supplier?.verified && role !== "supplier" && (
              <span className="chip chip-verified inline-flex items-center gap-1"><ShieldCheck size={11} /> Verified</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {role === "supplier" ? "Buyer" : `${supplier?.type ?? "Supplier"} · usually replies in 2 hrs`}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowReport(true)} className="text-xs border border-destructive/40 text-destructive rounded-md px-3 py-1.5 font-semibold inline-flex items-center gap-1 hover:bg-destructive/5">
            <Flag size={12} /> Report
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto bg-muted/30 space-y-3">
        <div className="rounded-md bg-warning/15 text-warning-foreground px-3 py-2 text-xs flex items-start gap-2">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">All conversations are logged.</span> Pay only through PSG escrow.
            Never pay outside the platform — PSG cannot protect off-platform payments.
          </div>
        </div>

        {conv.messages.map((m) => (
          <MessageRow key={m.id} m={m} meRole={meRole} role={role}
            onAccept={acceptOfferInChat}
            onReject={rejectOfferInChat}
            onRequestChanges={(id) => setShowChanges(id)}
            onSendOfferForReq={(reqId) => { setOfferFromReq(reqId); setShowOffer(true); }}
            onEditRequest={() => setShowRequest(true)}
            onCancelRequest={(reqId) => { updateRequest(reqId, { status: "Rejected" }); toast("Request cancelled"); }}
            onDeclineRequest={(reqId) => { updateRequest(reqId, { status: "Rejected" }); toast("Request declined"); }}
            onRevise={(id) => { setReviseOfferId(id); setShowOffer(true); }}
            onWithdraw={(id) => { rejectOffer(id, "Withdrawn by supplier"); toast("Offer withdrawn"); }}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex items-end gap-2 relative">
        <div className="relative">
          <button onClick={() => setShowAttach((v) => !v)} className="p-2 rounded hover:bg-muted" aria-label="Attach">
            <Paperclip size={18} />
          </button>
          {showAttach && <AttachmentMenu role={role} onPick={pickAttachment} onClose={() => setShowAttach(false)} />}
        </div>
        <textarea
          rows={1}
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); trySend(); } }}
          className="flex-1 border rounded-md px-3 py-2 text-sm resize-none max-h-32"
          placeholder="Write a message... (Enter to send)"
        />
        <button onClick={trySend} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold flex items-center gap-1.5 h-10">
          <Send size={14} /> Send
        </button>
      </div>

      {showRequest && (
        <RequestCustomQuoteModal
          open={showRequest}
          onClose={() => { setShowRequest(false); setOfferFromReq(undefined); }}
          supplierId={conv.supplierId}
          defaultProductName={productDefault?.title}
          defaultCategory={productDefault?.category}
          defaultUnit={productDefault?.unit}
          onCreated={(reqId) => {
            attachCard(conv.id, "buyer", "custom_request", { requestId: reqId }, "Sent a custom quote request");
            pushNotification({
              role: "supplier", kind: "custom_request",
              title: "New custom request",
              body: `${conv.buyerBusiness} sent a request.`,
              href: "/messages",
            });
          }}
        />
      )}
      {showOffer && (offerFromReq || reviseOfferId) && (
        <OfferModalWrapper
          convId={conv.id}
          supplierId={conv.supplierId}
          reviseOfferId={reviseOfferId}
          requestId={offerFromReq}
          onClose={() => { setShowOffer(false); setOfferFromReq(undefined); setReviseOfferId(undefined); }}
        />
      )}
      {showOffer && !offerFromReq && !reviseOfferId && (
        // Supplier tries to send offer with no active request — pick most recent from this conv
        <OfferModalWrapper
          convId={conv.id}
          supplierId={conv.supplierId}
          requestId={findMostRecentRequestId(conv)}
          onClose={() => setShowOffer(false)}
        />
      )}
      {showChanges && (
        <RequestChangesModal open={!!showChanges} onClose={() => setShowChanges(undefined)} offerId={showChanges} />
      )}
      {showReport && (
        <ReportModal open={showReport} onClose={() => setShowReport(false)}
          target={{ type: "conversation", id: conv.id, label: headerName }} />
      )}
      {flagged && (
        <OffPlatformWarningModal keyword={flagged} onContinue={forceSend} onCancel={() => setFlagged(null)} />
      )}
    </div>
  );
}

function findMostRecentRequestId(conv: Conversation): string | undefined {
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].kind === "custom_request" && conv.messages[i].requestId) {
      return conv.messages[i].requestId;
    }
  }
  return undefined;
}

function OfferModalWrapper({ convId, supplierId, requestId, reviseOfferId, onClose }: {
  convId: string; supplierId: string; requestId?: string; reviseOfferId?: string; onClose: () => void;
}) {
  const req = useRequest(requestId ?? "");
  const revising = useOffer(reviseOfferId ?? "");
  if (!req && !revising) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
        <div className="bg-card rounded-lg p-5 max-w-sm text-sm" onClick={(e) => e.stopPropagation()}>
          <div className="font-semibold mb-2">No active request</div>
          <p className="text-muted-foreground">Ask the buyer to send a custom request first. The offer will attach to it.</p>
          <button onClick={onClose} className="mt-3 border rounded-md px-3 py-1.5 text-sm">Close</button>
        </div>
      </div>
    );
  }
  return (
    <SendCustomOfferModal
      open={true}
      onClose={onClose}
      supplierId={supplierId}
      request={req}
      revisingOffer={revising}
      onSent={(offerId) => {
        attachCard(convId, "supplier", "custom_offer", { offerId }, "Sent a custom offer");
        pushNotification({
          role: "buyer", kind: "custom_offer",
          title: "New custom offer",
          body: `Supplier sent an offer — review in Messages.`,
          href: "/messages",
        });
      }}
    />
  );
}

// ---------- Message row rendering ----------
function MessageRow({ m, meRole, role, onAccept, onReject, onRequestChanges, onSendOfferForReq, onEditRequest, onCancelRequest, onDeclineRequest, onRevise, onWithdraw }: {
  m: ChatMessage;
  meRole: "buyer" | "supplier";
  role: DemoRole;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onRequestChanges: (offerId: string) => void;
  onSendOfferForReq: (reqId: string) => void;
  onEditRequest: () => void;
  onCancelRequest: (reqId: string) => void;
  onDeclineRequest: (reqId: string) => void;
  onRevise: (offerId: string) => void;
  onWithdraw: (offerId: string) => void;
}) {
  if (m.kind === "system" || m.from === "system") {
    return (
      <div className="text-center text-[11px] text-muted-foreground italic">{m.text ?? "System event"}</div>
    );
  }
  const isMe = m.from === meRole;
  const align = isMe ? "justify-end" : "justify-start";

  if (m.kind === "custom_request" && m.requestId) {
    return (
      <div className={`flex ${align}`}>
        <CustomRequestCard
          requestId={m.requestId} role={role}
          onSendOffer={() => onSendOfferForReq(m.requestId!)}
          onEdit={onEditRequest}
          onCancel={() => onCancelRequest(m.requestId!)}
          onDecline={() => onDeclineRequest(m.requestId!)}
        />
      </div>
    );
  }
  if (m.kind === "custom_offer" && m.offerId) {
    return (
      <div className={`flex ${align}`}>
        <CustomOfferCard
          offerId={m.offerId} role={role}
          onAccept={() => onAccept(m.offerId!)}
          onReject={() => onReject(m.offerId!)}
          onRequestChanges={() => onRequestChanges(m.offerId!)}
          onRevise={() => onRevise(m.offerId!)}
          onWithdraw={() => onWithdraw(m.offerId!)}
        />
      </div>
    );
  }
  if (m.kind === "order_created" && m.orderId) {
    return (
      <div className={`flex ${align}`}>
        <OrderCreatedCard orderId={m.orderId} />
      </div>
    );
  }
  // text
  return (
    <div className={`flex ${align}`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
          isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"
        } ${m.flagged ? "ring-2 ring-warning" : ""}`}
      >
        <div className="whitespace-pre-wrap">{m.text}</div>
        {m.flagged && (
          <div className={`text-[10px] mt-1 inline-flex items-center gap-1 ${isMe ? "text-white/80" : "text-warning"}`}>
            <ShieldAlert size={10} /> Flagged: off-platform payment
          </div>
        )}
        <div className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-muted-foreground"}`}>{m.at}</div>
      </div>
    </div>
  );
}
