import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TicketX, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — RailYatra" },
      {
        name: "description",
        content: "View your confirmed railway tickets, PNR numbers and cancel journeys online.",
      },
      { property: "og:title", content: "My Bookings — RailYatra" },
      { property: "og:description", content: "Manage your railway ticket reservations." },
    ],
  }),
  component: BookingsPage,
});

type PassengerRow = { name: string; age: number; gender: string };

function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookings = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trains(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "CANCELLED" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Ticket cancelled and seats released");
    },
    onError: () => toast.error("Could not cancel this ticket"),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl">My bookings</h1>
      <p className="mt-2 text-muted-foreground">
        Every ticket you have reserved, with its PNR and current status.
      </p>

      <div className="mt-8 space-y-4">
        {bookings.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

        {bookings.data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Ticket className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No bookings yet</p>
            <Button asChild className="mt-4">
              <Link to="/trains">Search trains</Link>
            </Button>
          </div>
        )}

        {bookings.data?.map((b) => {
          const train = b.trains;
          const list = (b.passengers as unknown as PassengerRow[]) ?? [];
          return (
            <article
              key={b.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-ticket"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-3">
                <div>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">PNR</p>
                  <p className="font-mono text-lg tracking-[0.2em]">{b.pnr}</p>
                </div>
                <Badge variant={b.status === "CONFIRMED" ? "default" : "destructive"}>
                  {b.status}
                </Badge>
              </header>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="font-medium">
                    {train?.train_number} — {train?.train_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {train?.source} {formatTime(train?.departure_time)} → {train?.destination}{" "}
                    {formatTime(train?.arrival_time)}
                  </p>
                  <p className="mt-2 text-sm">{formatDate(b.journey_date)}</p>
                </div>
                <div>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">
                    Passengers
                  </p>
                  <ul className="mt-1 text-sm">
                    {list.map((p, i) => (
                      <li key={i}>
                        {p.name} · {p.age} · {p.gender}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">{formatMoney(b.total_fare)}</p>
                </div>
              </div>

              {b.status === "CONFIRMED" && (
                <footer className="border-t border-border px-5 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(b.id)}
                  >
                    <TicketX className="size-4" /> Cancel ticket
                  </Button>
                </footer>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
