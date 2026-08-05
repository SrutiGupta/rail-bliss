import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { TrainFront, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/trains", label: "Search trains" },
  { to: "/pnr", label: "PNR status" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    ...links,
    ...(user ? [{ to: "/bookings", label: "My bookings" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-platform text-rail-foreground">
            <TrainFront className="size-5" />
          </span>
          <span className="text-display text-lg leading-none">
            RailYatra
            <span className="block text-[10px] font-normal tracking-[0.18em] text-muted-foreground uppercase">
              Ticket booking
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!loading &&
            (user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Login / Register</Link>
              </Button>
            ))}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-border md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col p-2">
          {nav.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
