import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col justify-center overflow-hidden bg-platform text-rail-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(90deg,transparent_0_48px,rgba(255,255,255,.35)_48px_50px)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20">
        <p className="text-xs tracking-[0.28em] text-accent uppercase">
          Railway ticket booking system
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
          Book your seat before the platform announcement.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-rail-foreground/80">
          Search trains, reserve confirmed berths, track PNR status and cancel without standing in
          a queue.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          {user ? (
            <>
              <Link
                to="/trains"
                className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Search trains
              </Link>
              <Link
                to="/pnr"
                className="rounded-md border border-rail-foreground/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-rail-foreground/10"
              >
                Check PNR status
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
