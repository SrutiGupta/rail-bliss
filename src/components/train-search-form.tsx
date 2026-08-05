import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayISO } from "@/lib/format";

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trains").select("source, destination");
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((t) => {
        set.add(t.source);
        set.add(t.destination);
      });
      return [...set].sort();
    },
  });
}

export function TrainSearchForm({
  initial,
}: {
  initial?: { from?: string | undefined; to?: string | undefined; date?: string | undefined };
}) {
  const navigate = useNavigate();
  const { data: stations = [] } = useStations();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/trains", search: { from, to, date } });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-lift sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="from">From</Label>
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger id="from">
            <SelectValue placeholder="Boarding station" />
          </SelectTrigger>
          <SelectContent>
            {stations.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        aria-label="Swap stations"
        onClick={() => {
          setFrom(to);
          setTo(from);
        }}
      >
        <ArrowLeftRight className="size-4" />
      </Button>

      <div className="grid gap-2">
        <Label htmlFor="to">To</Label>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger id="to">
            <SelectValue placeholder="Destination station" />
          </SelectTrigger>
          <SelectContent>
            {stations.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:col-span-3">
        <Label htmlFor="date">Journey date</Label>
        <Input
          id="date"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="sm:col-start-4 sm:row-start-2">
        <Search className="size-4" /> Search trains
      </Button>
    </form>
  );
}
