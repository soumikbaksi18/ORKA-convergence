import { AppHeader } from "@/components/app/AppHeader";
import { AppStatusBar } from "@/components/app/AppStatusBar";

export default function AppLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <AppHeader />
      <div className="flex-1 overflow-auto">{children}</div>
      <AppStatusBar />
    </div>
  );
}
