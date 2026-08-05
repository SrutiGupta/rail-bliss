import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, register } = useAuth();
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/bookings";

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = credentials.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setBusy(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Logged in successfully");
      navigate("/bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const schema = credentials.extend({
      full_name: z.string().trim().min(2, "Enter your full name").max(100),
      phone: z.string().trim().max(20).optional(),
    });
    const parsed = schema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
      full_name: form.get("full_name"),
      phone: form.get("phone") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setBusy(true);
    try {
      await register({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.full_name,
        phone: parsed.data.phone || undefined,
      });
      toast.success("Welcome aboard!");
      navigate("/bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  function google() {
    toast.info(
      "Google sign-in isn't available in this build. Create an account with email and password instead.",
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl">Passenger account</h1>
      <p className="mt-2 text-muted-foreground">
        Log in to book tickets and manage your reservations.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-ticket">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={signIn} className="grid gap-4 pt-4">
              <Field id="login-email" name="email" label="Email" type="email" />
              <Field id="login-password" name="password" label="Password" type="password" />
              <Button type="submit" disabled={busy}>
                {busy ? "Validating…" : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={signUp} className="grid gap-4 pt-4">
              <Field id="reg-name" name="full_name" label="Full name" />
              <Field id="reg-email" name="email" label="Email" type="email" />
              <Field id="reg-phone" name="phone" label="Phone (optional)" required={false} />
              <Field id="reg-password" name="password" label="Password" type="password" />
              <Button type="submit" disabled={busy}>
                {busy ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={google}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} autoComplete="on" />
    </div>
  );
}