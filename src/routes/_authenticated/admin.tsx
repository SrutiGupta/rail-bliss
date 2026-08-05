import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Plus, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — RailYatra" },
      {
        name: "description",
        content: "Administrators manage train schedules, seat capacity, fares and all bookings.",
      },
      { property: "og:title", content: "Admin Console — RailYatra" },
      { property: "og:description", content: "Manage trains and monitor every booking." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-2xl">Administrator access only</h1>
        <p className="mt-2 text-muted-foreground">
          Your account does not have the admin role, so train and booking management is
          unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl">Admin console</h1>
      <p className="mt-2 text-muted-foreground">
        Manage train schedules and monitor every booking in the system.
      </p>

      <Tabs defaultValue="trains" className="mt-8">
        <TabsList>
          <TabsTrigger value="trains">Manage trains</TabsTrigger>
          <TabsTrigger value="bookings">Manage bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="trains" className="pt-6">
          <ManageTrains />
        </TabsContent>
        <TabsContent value="bookings" className="pt-6">
          <ManageBookings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const emptyTrain = {
  train_number: "",
  train_name: "",
  source: "",
  destination: "",
  departure_time: "06:00",
  arrival_time: "12:00",
  duration_minutes: "360",
  total_seats: "100",
  fare: "500",
  coach_class: "Sleeper",
};

function ManageTrains() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyTrain });

  const trains = useQuery({
    queryKey: ["admin-trains"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trains").select("*").order("train_number");
      if (error) throw error;
      return data;
    },
  });

  const addTrain = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trains").insert({
        train_number: form.train_number.trim(),
        train_name: form.train_name.trim(),
        source: form.source.trim(),
        destination: form.destination.trim(),
        departure_time: form.departure_time,
        arrival_time: form.arrival_time,
        duration_minutes: Number(form.duration_minutes) || 0,
        total_seats: Number(form.total_seats) || 0,
        fare: Number(form.fare) || 0,
        coach_class: form.coach_class.trim() || "Sleeper",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      queryClient.invalidateQueries({ queryKey: ["trains"] });
      setForm({ ...emptyTrain });
      toast.success("Train added to the timetable");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSeats = useMutation({
    mutationFn: async ({ id, total_seats }: { id: string; total_seats: number }) => {
      const { error } = await supabase.from("trains").update({ total_seats }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      toast.success("Seat capacity updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const removeTrain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      toast.success("Train removed");
    },
    onError: () => toast.error("Cannot delete a train that already has bookings"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.train_number.trim() || !form.train_name.trim()) {
      toast.error("Train number and name are required");
      return;
    }
    addTrain.mutate();
  }

  const fields: [keyof typeof emptyTrain, string, string][] = [
    ["train_number", "Train number", "text"],
    ["train_name", "Train name", "text"],
    ["source", "Source", "text"],
    ["destination", "Destination", "text"],
    ["departure_time", "Departure", "time"],
    ["arrival_time", "Arrival", "time"],
    ["duration_minutes", "Duration (min)", "number"],
    ["total_seats", "Total seats", "number"],
    ["fare", "Fare (₹)", "number"],
    ["coach_class", "Class", "text"],
  ];

  return (
    <div className="space-y-8">
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-ticket sm:grid-cols-3 lg:grid-cols-5"
      >
        {fields.map(([key, label, type]) => (
          <div key={key} className="grid gap-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="flex items-end">
          <Button type="submit" disabled={addTrain.isPending}>
            <Plus className="size-4" /> Add train
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-ticket">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {trains.data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">{t.train_number}</TableCell>
                <TableCell>{t.train_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.source} → {t.destination}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTime(t.departure_time)}–{formatTime(t.arrival_time)}
                </TableCell>
                <TableCell>{formatMoney(t.fare)}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={t.total_seats}
                    className="w-24"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v && v !== t.total_seats)
                        updateSeats.mutate({ id: t.id, total_seats: v });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete train"
                    onClick={() => removeTrain.mutate(t.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ManageBookings() {
  const queryClient = useQueryClient();
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, trains(train_number, train_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking status updated");
    },
    onError: () => toast.error("Update failed"),
  });

  if (bookings.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-ticket">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PNR</TableHead>
            <TableHead>Train</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead>Fare</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.data?.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono">{b.pnr}</TableCell>
              <TableCell>
                {b.trains?.train_number} — {b.trains?.train_name}
              </TableCell>
              <TableCell>{formatDate(b.journey_date)}</TableCell>
              <TableCell>{b.seat_count}</TableCell>
              <TableCell>{formatMoney(b.total_fare)}</TableCell>
              <TableCell>
                <Badge variant={b.status === "CONFIRMED" ? "default" : "destructive"}>
                  {b.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setStatus.mutate({
                      id: b.id,
                      status: b.status === "CONFIRMED" ? "CANCELLED" : "CONFIRMED",
                    })
                  }
                >
                  {b.status === "CONFIRMED" ? "Cancel" : "Restore"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
