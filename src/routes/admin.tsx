import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PSG" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const qc = useQueryClient();

  const businesses = useQuery({
    queryKey: ["admin-businesses"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const verify = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
      const { error } = await supabase.from("businesses").update({ verification_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      toast.success("Verification updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading || checking) {
    return <AppShell><div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div></AppShell>;
  }
  if (!user) {
    return <AppShell><div className="p-12 text-center">Please <Link to="/auth" className="text-primary font-semibold">sign in</Link> to continue.</div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <ShieldCheck className="mx-auto mb-3 text-muted-foreground" size={32} />
          <h1 className="font-display text-2xl">Admin access required</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Your account does not have the admin role. Grant it in the backend by inserting a row into <code>user_roles</code> with role <code>admin</code>.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-xs uppercase tracking-widest text-gold font-bold">Admin console</div>
          <h1 className="font-display text-3xl mt-1">Business Verification</h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {businesses.isLoading ? <Loader2 className="animate-spin" /> : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Business</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Location</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(businesses.data || []).map((b: any) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.business_name}</div>
                      <div className="text-xs text-muted-foreground">{b.industry}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {b.is_buyer && "Buyer "}{b.is_supplier && "Supplier "}{b.is_carrier && "Carrier"}
                    </td>
                    <td className="px-4 py-3 text-xs">{b.location}</td>
                    <td className="px-4 py-3"><span className={`chip ${b.verification_status === "verified" ? "chip-verified" : b.verification_status === "pending" ? "chip-primary" : ""}`}>{b.verification_status}</span></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => verify.mutate({ id: b.id, status: "verified" })}
                        className="text-xs bg-success/10 text-success rounded px-2 py-1 font-semibold hover:bg-success/20">Approve</button>
                      <button onClick={() => verify.mutate({ id: b.id, status: "rejected" })}
                        className="text-xs bg-destructive/10 text-destructive rounded px-2 py-1 font-semibold hover:bg-destructive/20">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
