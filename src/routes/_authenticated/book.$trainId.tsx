import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMoney, formatTime, todayISO } from "@/lib/format";

type Passenger = { name: string; age: string; gender: string };

export const Route = createFileRoute("/_authenticated/book/$trainId")({
  validateSearch: (search: Record<string, unknown>): { date?: string | undefined } => ({
    date: typeof search["date"] === "string" ? search["date"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book Ticket — RailYatra" },
      {
        name: "description",
        content: "Enter passenger details and confirm your railway reservation to receive a PNR.",
      },
      { property: "og:title", content: "Book Ticket — RailYatra" },
      { property: "og:description", content: "Confirm your railway reservation online." },
    ],
  }),
  component: BookPage,
});

const passengerSchema = z.object({
  name: z.string().trim().min(2, "Passenger name is too short").max(100),
  age: z.coerce.number().int().min(1, "Enter a valid age").max(120),
  gender: z.enum(["Male", "Female", "Other"]),
});

function BookPage() {
  const { trainId } = Route.useParams();
  const { date: searchDate } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [journeyDate, setJourneyDate] = useState(searchDate || todayISO());
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: "", age: "", gender: "Male" },
  ]);
  const [phone, setPhone] = useState("");

  const trainQuery = useQuery({
    queryKey: ["train", trainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trains")
        .select("*")
        .eq("id", trainId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const availability = useQuery({
    queryKey: ["availability", trainId, journeyDate],
    enabled: !!trainQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("seats_booked", {
        _train_id: trainId,
        _date: journeyDate,
      });
      if (error) throw error;
      return (trainQuery.data?.total_seats ?? 0) - (data ?? 0);
    },
  });

  const train = trainQuery.data;
  const totalFare = train ? Number(train.fare) * passengers.length : 0;

  const booking = useMutation({
    mutationFn: async () => {
      const parsed = z.array(passengerSchema).min(1).safeParse(passengers);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if ((availability.data ?? 0) < passengers.length)
        throw new Error("Not enough seats available on this date");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user!.id,
          train_id: trainId,
          journey_date: journeyDate,
          passengers: parsed.data,
          seat_count: parsed.data.length,
          total_fare: totalFare,
          contact_email: user!.email ?? null,
          contact_phone: phone || null,
        })
        .select("pnr")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`Booking confirmed — PNR ${data.pnr}`);
      navigate({ to: "/bookings" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (trainQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!train) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Train not found.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl">Book your ticket</h1>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-ticket">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-rail">{train.train_number}</span>
          <h2 className="text-lg">{train.train_name}</h2>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs">{train.coach_class}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {train.source} {formatTime(train.departure_time)} → {train.destination}{" "}
          {formatTime(train.arrival_time)} · {formatMoney(train.fare)} per seat
        </p>
      </section>

      <form
        className="mt-6 grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          booking.mutate();
        }}
      >
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-ticket sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="date">Journey date</Label>
            <Input
              id="date"
              type="date"
              min={todayISO()}
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {availability.isLoading
                ? "Checking availability…"
                : `${availability.data ?? 0} seats available on ${formatDate(journeyDate)}`}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Contact phone</Label>
            <Input
              id="phone"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-ticket">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">Passenger details</h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remove passenger"
                disabled={passengers.length <= 1}
                onClick={() => setPassengers((p) => p.slice(0, -1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-6 text-center font-mono">{passengers.length}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Add passenger"
                disabled={passengers.length >= 6}
                onClick={() =>
                  setPassengers((p) => [...p, { name: "", age: "", gender: "Male" }])
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {passengers.map((p, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                <div className="grid gap-2">
                  <Label htmlFor={`name-${i}`}>Name</Label>
                  <Input
                    id={`name-${i}`}
                    value={p.name}
                    maxLength={100}
                    onChange={(e) =>
                      setPassengers((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`age-${i}`}>Age</Label>
                  <Input
                    id={`age-${i}`}
                    inputMode="numeric"
                    value={p.age}
                    onChange={(e) =>
                      setPassengers((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, age: e.target.value.replace(/\D/g, "") } : x,
                        ),
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select
                    value={p.gender}
                    onValueChange={(v) =>
                      setPassengers((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, gender: v } : x)),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Male", "Female", "Other"].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-secondary/50 p-5">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Total fare</p>
            <p className="text-display text-2xl">{formatMoney(totalFare)}</p>
          </div>
          <Button type="submit" size="lg" disabled={booking.isPending}>
            {booking.isPending ? "Confirming…" : "Confirm booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
