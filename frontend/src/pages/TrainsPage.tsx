import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrainFront, ArrowRight } from "lucide-react";
import { http } from "@/api/client";
import type { Train } from "@/api/types";
import { TrainSearchForm } from "@/components/train-search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatMoney, formatTime, todayISO } from "@/lib/format";

export function TrainsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const date = searchParams.get("date") ?? todayISO();

  const query = useQuery({
    queryKey: ["trains", from, to, date],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (date) params.set("date", date);
      return http.get<Train[]>(`/trains?${params.toString()}`);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Search trains</h1>
      <p className="mt-2 text-muted-foreground">
        Availability is shown for the selected journey date.
      </p>

      <div className="mt-6">
        <TrainSearchForm initial={{ ...(from ? { from } : {}), ...(to ? { to } : {}), date }} />
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
                <span className="font-mono text-sm text-rail">{t.trainNumber}</span>
                <h2 className="text-lg">{t.trainName}</h2>
                <Badge variant="secondary">{t.coachClass}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-base">{formatTime(t.departureTime)}</span>
                <span className="text-muted-foreground">{t.source}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-px w-8 bg-border" />
                  {formatDuration(t.durationMinutes)}
                  <ArrowRight className="size-3" />
                </span>
                <span className="font-mono text-base">{formatTime(t.arrivalTime)}</span>
                <span className="text-muted-foreground">{t.destination}</span>
              </div>
            </div>

            <div className="text-sm">
              <p className="text-2xl text-display">{formatMoney(t.fare)}</p>
              <p className="text-muted-foreground">per passenger</p>
              <p className="mt-1">
                {t.available !== undefined && t.available > 0 ? (
                  <span className="font-medium text-success">
                    AVAILABLE {String(t.available).padStart(3, "0")}
                  </span>
                ) : (
                  <span className="font-medium text-destructive">WAITING LIST / FULL</span>
                )}
              </p>
            </div>

            <Button asChild disabled={t.available !== undefined && t.available <= 0}>
              <Link
                to={`/book/${t.id}?date=${encodeURIComponent(date)}`}
                state={{ from: location }}
              >
                Book now
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}