// Messages store — conversation + message list with typed cards.
// Each message has absolute role (buyer/supplier/system). UI decides "me/them" via useDemoRole().
import { useSyncExternalStore } from "react";
import { suppliers, supplierById } from "@/lib/mock-data";
import { pushNotification } from "./notifications";

export type MessageKind = "text" | "custom_request" | "custom_offer" | "order_created" | "system";
export type MessageActor = "buyer" | "supplier" | "system";

export type ChatMessage = {
  id: string;
  from: MessageActor;
  at: string;
  kind: MessageKind;
  text?: string;
  requestId?: string;
  offerId?: string;
  orderId?: string;
  flagged?: boolean; // off-platform payment flagged
};

export type Conversation = {
  id: string;
  supplierId: string;
  supplierName: string;
  buyerBusiness: string;
  messages: ChatMessage[];
  lastMessage: string;
  updatedAt: string;
  unreadForBuyer: number;
  unreadForSupplier: number;
};

const KEY = "psg_conversations_v2";
const isBrowser = typeof window !== "undefined";
const listeners = new Set<() => void>();
const EMPTY_CONVERSATIONS: Conversation[] = [];
let cache: { raw: string; value: Conversation[] } | undefined;
const conversationCache = new Map<string, { source: Conversation[]; value: Conversation | undefined }>();

if (isBrowser) {
  window.addEventListener("psg-msg-change", () => listeners.forEach((l) => l()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) listeners.forEach((l) => l()); });
}
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function read(): Conversation[] {
  if (!isBrowser) return EMPTY_CONVERSATIONS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_CONVERSATIONS;
    if (cache?.raw === raw) return cache.value;
    const value = JSON.parse(raw) as Conversation[];
    cache = { raw, value };
    conversationCache.clear();
    return value;
  } catch {
    return EMPTY_CONVERSATIONS;
  }
}
function write(list: Conversation[]) {
  if (!isBrowser) return;
  const raw = JSON.stringify(list);
  cache = { raw, value: list };
  conversationCache.clear();
  localStorage.setItem(KEY, raw);
  window.dispatchEvent(new CustomEvent("psg-msg-change"));
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
function mid() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function cid(supplierId: string) { return `conv_${supplierId}`; }

export const BUYER_NAME = "Lola Nena's Carinderia Group";

function seed() {
  if (!isBrowser) return;
  if (localStorage.getItem(KEY)) return;
  const convs: Conversation[] = [
    {
      id: cid("sup_001"), supplierId: "sup_001",
      supplierName: "Bulacan Grain & Rice Mills Inc.", buyerBusiness: BUYER_NAME,
      lastMessage: "Custom offer sent — 500 kg rice/month",
      updatedAt: "09:12", unreadForBuyer: 1, unreadForSupplier: 0,
      messages: [
        { id: mid(), from: "buyer", at: "09:02", kind: "text", text: "Hi! Interested in a 6-month recurring rice supply." },
        { id: mid(), from: "supplier", at: "09:04", kind: "text", text: "Sige, share your monthly volume and delivery site." },
        { id: mid(), from: "buyer", at: "09:05", kind: "custom_request", requestId: "req_001" },
        { id: mid(), from: "supplier", at: "09:10", kind: "text", text: "Nice, we can lock ₱46/kg for 6 months, free delivery ≥ 300 kg." },
        { id: mid(), from: "supplier", at: "09:12", kind: "custom_offer", offerId: "off_001" },
      ],
    },
    {
      id: cid("sup_004"), supplierId: "sup_004",
      supplierName: "Cavite Roasters & Co.", buyerBusiness: BUYER_NAME,
      lastMessage: "Cupping at our roastery Saturday 10 AM — sound good?",
      updatedAt: "08:30", unreadForBuyer: 0, unreadForSupplier: 0,
      messages: [
        { id: mid(), from: "supplier", at: "Yesterday", kind: "text", text: "Sending 3 sample profiles tomorrow." },
        { id: mid(), from: "buyer", at: "Yesterday", kind: "text", text: "Perfect. Can we cup together?" },
        { id: mid(), from: "supplier", at: "08:30", kind: "text", text: "Cupping at our roastery Saturday 10 AM — sound good?" },
      ],
    },
    {
      id: cid("sup_002"), supplierId: "sup_002",
      supplierName: "Pampanga Fresh Catch Coop", buyerBusiness: BUYER_NAME,
      lastMessage: "Tomorrow's bangus is 380g avg, ₱180/kg ok?",
      updatedAt: "06:14", unreadForBuyer: 1, unreadForSupplier: 0,
      messages: [
        { id: mid(), from: "supplier", at: "06:14", kind: "text", text: "Tomorrow's bangus is 380g avg, ₱180/kg ok?" },
      ],
    },
  ];
  write(convs);
}
seed();

// ---------- reads ----------
export function getConversations(): Conversation[] { return read(); }
export function getConversation(id: string): Conversation | undefined {
  const all = read();
  const cached = conversationCache.get(id);
  if (cached?.source === all) return cached.value;
  const value = all.find((c) => c.id === id);
  conversationCache.set(id, { source: all, value });
  return value;
}
export function getOrCreateWithSupplier(supplierId: string): Conversation {
  const existing = getConversation(cid(supplierId));
  if (existing) return existing;
  const sup = supplierById(supplierId) ?? suppliers[0];
  const conv: Conversation = {
    id: cid(supplierId), supplierId,
    supplierName: sup.name, buyerBusiness: BUYER_NAME,
    lastMessage: "", updatedAt: nowLabel(),
    unreadForBuyer: 0, unreadForSupplier: 0,
    messages: [],
  };
  const all = read();
  all.unshift(conv);
  write(all);
  return conv;
}

export function useConversations(): Conversation[] {
  return useSyncExternalStore(subscribe, getConversations, () => EMPTY_CONVERSATIONS);
}
export function useConversation(id: string | undefined): Conversation | undefined {
  return useSyncExternalStore(subscribe, () => (id ? getConversation(id) : undefined), () => undefined);
}

// ---------- mutations ----------
function updateConv(id: string, patch: Partial<Conversation> | ((c: Conversation) => Conversation)) {
  const all = read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const next = typeof patch === "function" ? patch(all[idx]) : { ...all[idx], ...patch };
  all[idx] = next;
  // move to top
  const [c] = all.splice(idx, 1);
  all.unshift(c);
  write(all);
}

export function sendText(convId: string, from: MessageActor, text: string, flagged = false) {
  const conv = getConversation(convId);
  if (!conv) return;
  const msg: ChatMessage = { id: mid(), from, at: nowLabel(), kind: "text", text, flagged };
  updateConv(convId, (c) => ({
    ...c,
    messages: [...c.messages, msg],
    lastMessage: text.slice(0, 80),
    updatedAt: msg.at,
    unreadForBuyer: from === "supplier" ? c.unreadForBuyer + 1 : c.unreadForBuyer,
    unreadForSupplier: from === "buyer" ? c.unreadForSupplier + 1 : c.unreadForSupplier,
  }));
  if (from === "supplier") {
    pushNotification({ role: "buyer", kind: "message", title: `New message from ${conv.supplierName}`, body: text.slice(0, 90), href: "/messages" });
  } else if (from === "buyer") {
    pushNotification({ role: "supplier", kind: "message", title: `New message from ${conv.buyerBusiness}`, body: text.slice(0, 90), href: "/messages" });
  }
}

export function attachCard(convId: string, from: MessageActor, kind: MessageKind, refs: { requestId?: string; offerId?: string; orderId?: string }, preview: string) {
  const conv = getConversation(convId);
  if (!conv) return;
  const msg: ChatMessage = { id: mid(), from, at: nowLabel(), kind, ...refs };
  updateConv(convId, (c) => ({
    ...c,
    messages: [...c.messages, msg],
    lastMessage: preview,
    updatedAt: msg.at,
    unreadForBuyer: from === "supplier" ? c.unreadForBuyer + 1 : c.unreadForBuyer,
    unreadForSupplier: from === "buyer" ? c.unreadForSupplier + 1 : c.unreadForSupplier,
  }));
}

export function markConversationRead(convId: string, forRole: "buyer" | "supplier") {
  updateConv(convId, (c) => ({
    ...c,
    unreadForBuyer: forRole === "buyer" ? 0 : c.unreadForBuyer,
    unreadForSupplier: forRole === "supplier" ? 0 : c.unreadForSupplier,
  }));
}

// ---------- safety ----------
export const OFF_PLATFORM_KEYWORDS = [
  "bank transfer", "gcash", "maya", "paymaya", "pay direct", "outside platform",
  "personal account", "send deposit", "cash on hand", "wire transfer",
];
export function containsOffPlatform(text: string): string | null {
  const low = text.toLowerCase();
  for (const kw of OFF_PLATFORM_KEYWORDS) if (low.includes(kw)) return kw;
  return null;
}
