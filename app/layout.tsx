// app/layout.tsx

import "./globals.css";
import "./utils/amplify-config"; // garante que configure é chamado 1x
import { AuthProvider } from "./contexts/AuthProvider";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
