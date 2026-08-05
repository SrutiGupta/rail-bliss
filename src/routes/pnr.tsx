import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, TicketCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export const Route = createFileRoute("/pnr")({
  head: () => ({
    meta: [
      { title: "PNR Status Check — RailYatra" },
      {
        name: "description",
        content:
          "Enter your 10-digit PNR number to see ticket status, train details, journey date and fare.",
      },
      { property: "og:title", content: "PNR Status Check — RailYatra" },
      { property: "og:description", content: "Check railway ticket status by PNR number." },
    ],
  }),
  component: PnrPage,
});

function PnrPage() {
  const [pnr, setPnr] = useState("");
  const mutation = useMutation({
    mutationFn: async (value: string) => {
      const { data, error } = await supabase.rpc("pnr_status", { _pnr: value });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = pnr.trim();
    if (!/^\d{10}$/.test(value)) return;
    mutation.mutate(value);
  }

  const result = mutation.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl">PNR status</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the 10-digit PNR printed on your ticket to view its current status.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-5 shadow-ticket sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div className="grid gap-2">
          <Label htmlFor="pnr">PNR number</Label>
          <Input
            id="pnr"
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 4821903756"
            value={pnr}
            onChange={(e) => setPnr(e.target.value.replace(/\D/g, ""))}
            className="font-mono tracking-[0.2em]"
          />
        </div>
        <Button type="submit" disabled={pnr.length !== 10 || mutation.isPending}>
          <Search className="size-4" /> {mutation.isPending ? "Checking…" : "Check status"}
        </Button>
      </form>

      {mutation.isSuccess && !result && (
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No ticket found for this PNR number. Please verify and try again.
        </p>
      )}

      {result && (
        <article className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-lift">
          <header className="flex flex-wrap items-center justify-between gap-3 bg-platform px-5 py-4 text-rail-foreground">
            <div className="flex items-center gap-3">
              <TicketCheck className="size-5 text-accent" />
              <div>
                <p className="text-xs tracking-widest uppercase opacity-75">PNR</p>
                <p className="font-mono text-lg tracking-[0.2em]">{result.pnr}</p>
              </div>
            </div>
            <Badge variant={result.status === "CONFIRMED" ? "default" : "destructive"}>
              {result.status}
            </Badge>
          </header>
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <Row label="Train">
              {result.train_number} — {result.train_name}
            </Row>
            <Row label="Journey date">{formatDate(result.journey_date)}</Row>
            <Row label="From">
              {result.source} · {formatTime(result.departure_time)}
            </Row>
            <Row label="To">
              {result.destination} · {formatTime(result.arrival_time)}
            </Row>
            <Row label="Seats">{result.seat_count}</Row>
            <Row label="Total fare">{formatMoney(result.total_fare)}</Row>
          </dl>
        </article>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
