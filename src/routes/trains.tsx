import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrainFront, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainSearchForm } from "@/components/train-search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatMoney, formatTime, todayISO } from "@/lib/format";

type TrainSearch = { from?: string | undefined; to?: string | undefined; date?: string | undefined };

export const Route = createFileRoute("/trains")({
  validateSearch: (search: Record<string, unknown>): TrainSearch => ({
    from: typeof search["from"] === "string" ? search["from"] : undefined,
    to: typeof search["to"] === "string" ? search["to"] : undefined,
    date: typeof search["date"] === "string" ? search["date"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search Trains & Seat Availability — RailYatra" },
      {
        name: "description",
        content:
          "Find trains between any two stations with departure timings, class, fare and live seat availability for your journey date.",
      },
      { property: "og:title", content: "Search Trains & Seat Availability — RailYatra" },
      {
        property: "og:description",
        content: "Live train search with fares and seat availability.",
      },
    ],
  }),
  component: TrainsPage,
});

function TrainsPage() {
  const search = Route.useSearch();
  const date = search.date || todayISO();

  const query = useQuery({
    queryKey: ["trains", search.from, search.to, date],
    queryFn: async () => {
      let q = supabase.from("trains").select("*").order("departure_time");
      if (search.from) q = q.eq("source", search.from);
      if (search.to) q = q.eq("destination", search.to);
      const { data, error } = await q;
      if (error) throw error;

      return Promise.all(
        (data ?? []).map(async (t) => {
          const { data: booked } = await supabase.rpc("seats_booked", {
            _train_id: t.id,
            _date: date,
          });
          return { ...t, available: t.total_seats - (booked ?? 0) };
        }),
      );
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Search trains</h1>
      <p className="mt-2 text-muted-foreground">
        Availability is shown for the selected journey date.
      </p>

      <div className="mt-6">
        <TrainSearchForm initial={{ ...search, date }} />
      </div>

      <div className="mt-8 space-y-4">
        {query.isLoading &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}

        {query.isError && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load trains. Please try again.
          </p>
        )}

        {query.data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <TrainFront className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No trains found on this route</p>
            <p className="text-sm text-muted-foreground">
              Try a different pair of stations or clear the filters.
            </p>
          </div>
        )}

        {query.data?.map((t) => (
          <article
            key={t.id}
            className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-ticket transition-shadow hover:shadow-lift md:grid-cols-[1.6fr_1fr_auto] md:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-rail">{t.train_number}</span>
                <h2 className="text-lg">{t.train_name}</h2>
                <Badge variant="secondary">{t.coach_class}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-base">{formatTime(t.departure_time)}</span>
                <span className="text-muted-foreground">{t.source}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-px w-8 bg-border" />
                  {formatDuration(t.duration_minutes)}
                  <ArrowRight className="size-3" />
                </span>
                <span className="font-mono text-base">{formatTime(t.arrival_time)}</span>
                <span className="text-muted-foreground">{t.destination}</span>
              </div>
            </div>

            <div className="text-sm">
              <p className="text-2xl text-display">{formatMoney(t.fare)}</p>
              <p className="text-muted-foreground">per passenger</p>
              <p className="mt-1">
                {t.available > 0 ? (
                  <span className="font-medium text-success">
                    AVAILABLE {String(t.available).padStart(3, "0")}
                  </span>
                ) : (
                  <span className="font-medium text-destructive">WAITING LIST / FULL</span>
                )}
              </p>
            </div>

            <Button asChild disabled={t.available <= 0}>
              <Link to="/book/$trainId" params={{ trainId: t.id }} search={{ date }}>
                Book now
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
