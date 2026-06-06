import "@/app/globals.css";
import CryptoPolyfill from "@/components/CryptoPolyfill";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <CryptoPolyfill />
      {children}
    </div>
  );
}
