import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <main className="pb-28 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}