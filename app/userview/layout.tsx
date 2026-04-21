import { ReactNode } from "react";
import "../globals.css";

export default function UserViewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar será renderizado por el page.tsx como client component */}
          {children}
        </div>
      </body>
    </html>
  );
}
