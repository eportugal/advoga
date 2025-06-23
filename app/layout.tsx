// app/layout.tsx

import "./globals.css";
import "./utils/amplify-config"; // garante que configure é chamado 1x
import { ProvideAuth } from "./contexts/ProvideAuth";
import { ProvideProfile } from "./contexts/ProvideProfile";
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
        <ProvideAuth>
          <ProvideProfile>
            <NavBar />
            <main>{children}</main>
            <Footer />
          </ProvideProfile>
        </ProvideAuth>
      </body>
    </html>
  );
}
