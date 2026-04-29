import "../globals.css";
import Sidebar from "@/components/Sidebar";
import FloatingChatBot from "@/app/ChatBot/FloatingChatBot";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />

          <main className="flex-1 p-8">
            {children}
          </main>

          <FloatingChatBot />
        </div>
      </body>
    </html>
  );
}
