import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, TicketCheck } from "lucide-react";
import { http } from "@/api/client";
import type { PnrStatus } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export function PnrPage() {
  const [pnr, setPnr] = useState("");
  const mutation = useMutation({
    mutationFn: async (value: string) => {
      try {
        return await http.get<PnrStatus>(`/pnr/${value}`);
      } catch (err) {
        if (err instanceof Error && err.message === "No ticket found for this PNR") {
          return null;
        }
        throw err;
      }
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = pnr.trim();
    if (!/^\d{10}$/.test(value)) {
      toast.error("PNR must be exactly 10 digits");
      return;
    }
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
              {result.trainNumber} — {result.trainName}
            </Row>
            <Row label="Journey date">{formatDate(result.journeyDate)}</Row>
            <Row label="From">
              {result.source} · {formatTime(result.departureTime)}
            </Row>
            <Row label="To">
              {result.destination} · {formatTime(result.arrivalTime)}
            </Row>
            <Row label="Seats">{result.seatCount}</Row>
            <Row label="Total fare">{formatMoney(result.totalFare)}</Row>
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