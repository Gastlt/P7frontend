import "../globals.css";
import Sidebar from "@/components/Sidebar";
import CryptoPolyfill from "@/components/CryptoPolyfill";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <CryptoPolyfill />
        {children}
      </main>
    </div>
  );
}