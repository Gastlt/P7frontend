import "../globals.css";
import Sidebar from "@/components/Sidebar";
import CryptoPolyfill from "@/components/CryptoPolyfill";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="ml-64 min-h-dvh p-8">
        <CryptoPolyfill />
        {children}
      </main>
    </div>
  );
}