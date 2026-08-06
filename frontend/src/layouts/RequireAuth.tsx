import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

function loginRequiredMessage(pathname: string): string {
  if (pathname.startsWith("/book/")) return "Please login to book a ticket.";
  if (pathname.startsWith("/bookings")) return "Please login to view your bookings.";
  if (pathname.startsWith("/admin")) return "Please login to access the admin console.";
  if (pathname.startsWith("/pnr")) return "Please login to check PNR status.";
  return "Please login to continue.";
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location, message: loginRequiredMessage(location.pathname) }}
      />
    );
  }

  return <Outlet />;
}