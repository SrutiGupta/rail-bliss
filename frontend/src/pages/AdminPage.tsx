import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Plus, ShieldAlert } from "lucide-react";
import { http } from "@/api/client";
import type { Booking, Train } from "@/api/types";
import { useAuth } from "@/lib/auth";
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

export function AdminPage() {
  const { user, loading } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");

  if (loading) {
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
  trainNumber: "",
  trainName: "",
  source: "",
  destination: "",
  departureTime: "06:00",
  arrivalTime: "12:00",
  durationMinutes: "360",
  totalSeats: "100",
  fare: "500",
  coachClass: "Sleeper",
};

function ManageTrains() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyTrain });

  const trains = useQuery({
    queryKey: ["admin-trains"],
    queryFn: () => http.get<Train[]>("/admin/trains"),
  });

  const addTrain = useMutation({
    mutationFn: async () => {
      await http.post("/admin/trains", {
        trainNumber: form.trainNumber.trim(),
        trainName: form.trainName.trim(),
        source: form.source.trim(),
        destination: form.destination.trim(),
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        durationMinutes: Number(form.durationMinutes) || 0,
        totalSeats: Number(form.totalSeats) || 0,
        fare: Number(form.fare) || 0,
        coachClass: form.coachClass.trim() || "Sleeper",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      queryClient.invalidateQueries({ queryKey: ["trains"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      setForm({ ...emptyTrain });
      toast.success("Train added to the timetable");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSeats = useMutation({
    mutationFn: async ({ id, totalSeats }: { id: string; totalSeats: number }) => {
      await http.patch(`/admin/trains/${id}`, { totalSeats });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      toast.success("Seat capacity updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const removeTrain = useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/admin/trains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trains"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.success("Train removed");
    },
    onError: () => toast.error("Cannot delete a train that already has bookings"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.trainNumber.trim() || !form.trainName.trim()) {
      toast.error("Train number and name are required");
      return;
    }
    addTrain.mutate();
  }

  const fields: [keyof typeof emptyTrain, string, string][] = [
    ["trainNumber", "Train number", "text"],
    ["trainName", "Train name", "text"],
    ["source", "Source", "text"],
    ["destination", "Destination", "text"],
    ["departureTime", "Departure", "time"],
    ["arrivalTime", "Arrival", "time"],
    ["durationMinutes", "Duration (min)", "number"],
    ["totalSeats", "Total seats", "number"],
    ["fare", "Fare (₹)", "number"],
    ["coachClass", "Class", "text"],
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
                <TableCell className="font-mono">{t.trainNumber}</TableCell>
                <TableCell>{t.trainName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {t.source} → {t.destination}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatTime(t.departureTime)}–{formatTime(t.arrivalTime)}
                </TableCell>
                <TableCell>{formatMoney(t.fare)}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={t.totalSeats}
                    className="w-24"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v && v !== t.totalSeats)
                        updateSeats.mutate({ id: t.id, totalSeats: v });
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
    queryFn: () => http.get<Booking[]>("/admin/bookings"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "CONFIRMED" | "CANCELLED" }) => {
      await http.patch(`/admin/bookings/${id}/status`, { status });
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
                {b.train?.trainNumber} — {b.train?.trainName}
              </TableCell>
              <TableCell>{formatDate(b.journeyDate)}</TableCell>
              <TableCell>{b.seatCount}</TableCell>
              <TableCell>{formatMoney(b.totalFare)}</TableCell>
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