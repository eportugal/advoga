import "./globals.css";
import "./utils/amplify-config";
import { AuthProvider } from "./contexts/AuthProvider";
import ClientLayout from "./ClientLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
