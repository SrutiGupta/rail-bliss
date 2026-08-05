-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'passenger');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trains
CREATE TABLE public.trains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number TEXT NOT NULL UNIQUE,
  train_name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  total_seats INTEGER NOT NULL DEFAULT 100,
  fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  coach_class TEXT NOT NULL DEFAULT 'Sleeper',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trains TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trains TO authenticated;
GRANT ALL ON public.trains TO service_role;
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trains public read" ON public.trains FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "trains admin write" ON public.trains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE RESTRICT,
  journey_date DATE NOT NULL,
  passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
  seat_count INTEGER NOT NULL DEFAULT 1,
  total_fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings own read" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings own insert" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings own update" ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX bookings_train_date_idx ON public.bookings (train_id, journey_date);

-- PNR generator
CREATE OR REPLACE FUNCTION public.generate_pnr()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE candidate TEXT;
BEGIN
  LOOP
    candidate := lpad((floor(random() * 1000000000)::bigint)::text, 10, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE pnr = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;
ALTER TABLE public.bookings ALTER COLUMN pnr SET DEFAULT public.generate_pnr();

-- Public PNR status lookup (no PII beyond what the PNR holder needs)
CREATE OR REPLACE FUNCTION public.pnr_status(_pnr TEXT)
RETURNS TABLE (
  pnr TEXT, status TEXT, journey_date DATE, seat_count INTEGER,
  total_fare NUMERIC, train_number TEXT, train_name TEXT,
  source TEXT, destination TEXT, departure_time TIME, arrival_time TIME
) LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.pnr, b.status, b.journey_date, b.seat_count, b.total_fare,
         t.train_number, t.train_name, t.source, t.destination, t.departure_time, t.arrival_time
  FROM public.bookings b JOIN public.trains t ON t.id = b.train_id
  WHERE b.pnr = _pnr;
$$;
GRANT EXECUTE ON FUNCTION public.pnr_status(TEXT) TO anon, authenticated;

-- Seats booked helper (public, aggregate only)
CREATE OR REPLACE FUNCTION public.seats_booked(_train_id UUID, _date DATE)
RETURNS INTEGER LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(seat_count), 0)::int FROM public.bookings
  WHERE train_id = _train_id AND journey_date = _date AND status = 'CONFIRMED';
$$;
GRANT EXECUTE ON FUNCTION public.seats_booked(UUID, DATE) TO anon, authenticated;

INSERT INTO public.trains (train_number, train_name, source, destination, departure_time, arrival_time, duration_minutes, total_seats, fare, coach_class) VALUES
('12301','Howrah Rajdhani Express','Howrah','New Delhi','16:50','10:00',1030,120,2450.00,'AC 3 Tier'),
('12259','Sealdah Duronto Express','Sealdah','New Delhi','20:05','12:30',985,110,2280.00,'AC 3 Tier'),
('12841','Coromandel Express','Howrah','Chennai','14:30','17:00',1590,150,1350.00,'Sleeper'),
('12809','Howrah Mumbai Mail','Howrah','Mumbai CSMT','20:15','04:30',1935,160,1180.00,'Sleeper'),
('13007','Udyan Abha Toofan Express','Howrah','Varanasi','07:20','23:45',985,180,640.00,'Sleeper'),
('12019','Howrah Ranchi Shatabdi','Howrah','Ranchi','06:05','13:15',430,90,1090.00,'AC Chair Car'),
('12303','Poorva Express','Howrah','New Delhi','08:15','09:55',1540,140,1420.00,'Sleeper'),
('22308','Bhubaneswar Superfast','Howrah','Bhubaneswar','22:35','05:40',425,130,760.00,'AC 3 Tier'),
('12345','Saraighat Express','Howrah','Guwahati','15:50','09:30',1060,150,1260.00,'Sleeper'),
('12987','Sealdah Ajmer Express','Sealdah','Ajmer','23:10','08:20',1870,140,1560.00,'Sleeper'),
('12313','Sealdah Rajdhani','Sealdah','New Delhi','16:50','10:10',1040,120,2510.00,'AC 2 Tier'),
('18183','Tatanagar Express','Danapur','Tatanagar','06:40','18:05',685,170,410.00,'Sleeper');