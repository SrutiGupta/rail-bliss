import { Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { RequireAuth } from "@/layouts/RequireAuth";
import { HomePage } from "@/pages/HomePage";
import { AuthPage } from "@/pages/AuthPage";
import { TrainsPage } from "@/pages/TrainsPage";
import { PnrPage } from "@/pages/PnrPage";
import { BookPage } from "@/pages/BookPage";
import { BookingsPage } from "@/pages/BookingsPage";
import { AdminPage } from "@/pages/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/trains" element={<TrainsPage />} />
          <Route path="/pnr" element={<PnrPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/book/:trainId" element={<BookPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}