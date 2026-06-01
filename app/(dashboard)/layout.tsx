import "../globals.css";
import Sidebar from "@/components/Sidebar";
import CryptoPolyfill from "@/components/CryptoPolyfill";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CryptoPolyfill />
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />

          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}