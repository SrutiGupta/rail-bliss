REVOKE ALL ON FUNCTION public.generate_pnr() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.seats_booked(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pnr_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seats_booked(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pnr_status(TEXT) TO anon, authenticated;