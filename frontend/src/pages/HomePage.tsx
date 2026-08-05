import { Link } from "react-router-dom";
import { ShieldCheck, Ticket, Clock3, XCircle, Search, UserCheck } from "lucide-react";
import { TrainSearchForm } from "@/components/train-search-form";

const features = [
  {
    icon: Search,
    title: "Train search",
    text: "Find every train running between two stations with timings, class and fare.",
  },
  {
    icon: Ticket,
    title: "Instant PNR",
    text: "Confirmed booking generates a unique 10-digit PNR straight away.",
  },
  {
    icon: Clock3,
    title: "Live availability",
    text: "Seat availability is computed per train per journey date before you pay.",
  },
  {
    icon: XCircle,
    title: "Easy cancellation",
    text: "Cancel any confirmed ticket from your bookings; seats return to the pool.",
  },
  {
    icon: ShieldCheck,
    title: "Secure accounts",
    text: "Credential validation and row-level protection keep every ticket private.",
  },
  {
    icon: UserCheck,
    title: "Admin control",
    text: "Administrators manage train schedules and monitor all bookings.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-platform text-rail-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(90deg,transparent_0_48px,rgba(255,255,255,.35)_48px_50px)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-28">
          <p className="text-xs tracking-[0.28em] text-accent uppercase">
            Railway ticket booking system
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Book your seat before the platform announcement.
          </h1>
          <p className="mt-4 max-w-xl text-base text-rail-foreground/80">
            Search trains, reserve confirmed berths, track PNR status and cancel without standing in
            a queue.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/pnr"
              className="rounded-md border border-rail-foreground/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-rail-foreground/10"
            >
              Check PNR status
            </Link>
            <Link
              to="/auth"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-16 max-w-4xl px-4">
        <TrainSearchForm />
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="text-2xl">What the system does</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every function from the requirements specification — passenger registration, train search,
          booking, cancellation, status check and administration.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 shadow-ticket transition-shadow hover:shadow-lift"
            >
              <span className="grid size-10 place-items-center rounded-md bg-secondary text-rail">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="grid gap-6 rounded-xl border border-border bg-secondary/50 p-8 sm:grid-cols-4">
          {[
            ["01", "Register or log in"],
            ["02", "Search your train"],
            ["03", "Enter passenger details"],
            ["04", "Get your PNR"],
          ].map(([n, label]) => (
            <div key={n}>
              <p className="font-mono text-3xl text-accent">{n}</p>
              <p className="mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}