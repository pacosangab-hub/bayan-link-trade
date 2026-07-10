import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Search, X, Clock, TrendingUp, Package, Store, Tag, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import {
  RECOMMENDED_SEARCHES,
  POPULAR_CATEGORY_NAMES,
  suggest,
  pushRecent,
  useRecent,
  clearRecent,
  type Suggestion,
} from "@/lib/search";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useRecent();

  const suggestions: Suggestion[] = q.trim() ? suggest(q, 12) : [];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function submit(term?: string) {
    const value = (term ?? q).trim();
    if (!value) return;
    pushRecent(value);
    setOpen(false);
    setQ("");
    navigate({ to: "/search", search: { q: value } });
  }

  function goSuggestion(s: Suggestion) {
    setOpen(false);
    setQ("");
    if (s.kind === "product") navigate({ to: "/products/$id", params: { id: s.id } });
    else if (s.kind === "supplier") navigate({ to: "/suppliers/$id", params: { id: s.id } });
    else if (s.kind === "category") navigate({ to: "/search", search: { q: s.name } });
    else if (s.kind === "related") { pushRecent(s.label); navigate({ to: "/search", search: { q: s.label } }); }
    else if (s.kind === "action") navigate({ to: s.to });
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      if (suggestions[active]) goSuggestion(suggestions[active]);
      else submit();
    } else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className={`flex w-full border-2 border-primary rounded-md overflow-hidden bg-background ${compact ? "" : ""}`}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
          placeholder="Search products, suppliers, categories…"
          aria-label="Search"
        />
        {q && (
          <button onClick={() => { setQ(""); inputRef.current?.focus(); }} className="px-2 text-muted-foreground hover:text-foreground" aria-label="Clear">
            <X size={16} />
          </button>
        )}
        <button onClick={() => submit()} className="bg-primary text-primary-foreground px-5 grid place-items-center">
          <Search size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {q.trim() === "" ? (
            <div className="p-3 space-y-4">
              <Section title="Recommended searches" icon={<TrendingUp size={13} />}>
                <div className="flex flex-wrap gap-1.5">
                  {RECOMMENDED_SEARCHES.map((s) => (
                    <button key={s} onClick={() => submit(s)} className="px-2.5 py-1 rounded-full text-xs border bg-card hover:bg-muted">
                      {s}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Popular categories" icon={<Tag size={13} />}>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CATEGORY_NAMES.map((c) => (
                    <button key={c} onClick={() => submit(c)} className="px-2.5 py-1 rounded-full text-xs border bg-primary/5 hover:bg-primary/10 text-primary">
                      {c}
                    </button>
                  ))}
                </div>
              </Section>
              {recent.length > 0 && (
                <Section
                  title="Recent searches"
                  icon={<Clock size={13} />}
                  action={<button onClick={clearRecent} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} onClick={() => submit(r)} className="px-2.5 py-1 rounded-full text-xs border bg-card hover:bg-muted inline-flex items-center gap-1">
                        <Clock size={11} /> {r}
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <SuggestionList suggestions={suggestions} active={active} onPick={goSuggestion} onHover={setActive} q={q} onSearchAll={() => submit()} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground inline-flex items-center gap-1.5">
          {icon} {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SuggestionList({
  suggestions, active, onPick, onHover, q, onSearchAll,
}: {
  suggestions: Suggestion[];
  active: number;
  onPick: (s: Suggestion) => void;
  onHover: (i: number) => void;
  q: string;
  onSearchAll: () => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        <div className="mb-3">No suggestions for “{q}”.</div>
        <button onClick={onSearchAll} className="text-primary font-semibold inline-flex items-center gap-1">
          Search anyway <ArrowRight size={14} />
        </button>
      </div>
    );
  }
  const groups: Record<string, Suggestion[]> = {};
  suggestions.forEach((s) => { (groups[s.kind] ||= []).push(s); });
  const labelFor: Record<string, { title: string; icon: React.ReactNode }> = {
    product: { title: "Products", icon: <Package size={13} /> },
    supplier: { title: "Suppliers", icon: <Store size={13} /> },
    category: { title: "Categories", icon: <Tag size={13} /> },
    related: { title: "Related searches", icon: <Sparkles size={13} /> },
    action: { title: "Actions", icon: <MessageSquare size={13} /> },
  };
  let idx = -1;
  return (
    <div className="py-1">
      {(["product", "supplier", "category", "related", "action"] as const).map((k) => {
        const list = groups[k];
        if (!list?.length) return null;
        return (
          <div key={k} className="py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              {labelFor[k].icon} {labelFor[k].title}
            </div>
            {list.map((s) => {
              idx++;
              const i = idx;
              const isActive = i === active;
              return (
                <button
                  key={`${k}-${i}`}
                  onMouseEnter={() => onHover(i)}
                  onClick={() => onPick(s)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm ${isActive ? "bg-primary/10" : "hover:bg-muted"}`}
                >
                  <span className="text-muted-foreground">{labelFor[k].icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{s.label}</span>
                    {"sub" in s && s.sub && <span className="block text-[11px] text-muted-foreground truncate">{s.sub}</span>}
                  </span>
                  <ArrowRight size={12} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Small helper for inline usage
export { Link };
