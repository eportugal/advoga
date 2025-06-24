"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { Scale, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const { user, signOut, isAuthenticated, profile, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200 p-4">
        Verificando sessão...
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Advogare</span>
        </Link>

        {/* Menu à direita */}
        <div className="flex items-center space-x-4">
          {/* ✅ Mostra link se for advogado */}
          {profile === "advogado" && (
            <Link
              href="/tickets/manage"
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Painel do Advogado
            </Link>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Sair</span>
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
