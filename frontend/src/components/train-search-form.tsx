import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Search } from "lucide-react";
import { useStations } from "@/api/stations";
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

export function TrainSearchForm({
  initial,
}: {
  initial?: { from?: string | undefined; to?: string | undefined; date?: string | undefined };
}) {
  const navigate = useNavigate();
  const { data: stations = [], isLoading: stationsLoading } = useStations();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    navigate(`/trains${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 shadow-lift">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* From */}
        <div className="grid flex-1 gap-2">
          <Label htmlFor="from">From</Label>
          <Select value={from} onValueChange={setFrom} disabled={stationsLoading}>
            <SelectTrigger id="from">
              <SelectValue placeholder={stationsLoading ? "Loading stations…" : "Boarding station"} />
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

        {/* Swap */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden shrink-0 self-end sm:inline-flex"
          aria-label="Swap stations"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <ArrowLeftRight className="size-4" />
        </Button>

        {/* To */}
        <div className="grid flex-1 gap-2">
          <Label htmlFor="to">To</Label>
          <Select value={to} onValueChange={setTo} disabled={stationsLoading}>
            <SelectTrigger id="to">
              <SelectValue placeholder={stationsLoading ? "Loading stations…" : "Destination station"} />
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

        {/* Journey date */}
        <div className="grid shrink-0 gap-2 sm:w-44">
          <Label htmlFor="date">Journey date</Label>
          <Input
            id="date"
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Search */}
        <Button type="submit" className="shrink-0 self-end gap-2">
          <Search className="size-4" />
          Search trains
        </Button>
      </div>
    </form>
  );
}