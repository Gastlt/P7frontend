import "@/app/globals.css";
import CryptoPolyfill from "@/components/CryptoPolyfill";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CryptoPolyfill />
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
