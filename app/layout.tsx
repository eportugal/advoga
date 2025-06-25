// app/layout.tsx
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";
import "./utils/amplify-config";
import { AuthProvider } from "./contexts/AuthProvider";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
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
          <ClientLayout>
            <NavBar />
            <main className="w-ful bg-white" style={{ marginTop: "64px" }}>
              {children}
            </main>
            <Footer />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
