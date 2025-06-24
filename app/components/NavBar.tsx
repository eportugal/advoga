"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { Scale, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const router = useRouter();
  const { isAuthenticated, dbUser, isLoading, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const userName = dbUser
    ? `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim()
    : "";
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link href="/" className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Advoga</span>
        </Link>

        <div className="flex items-center space-x-4">
          {profile === "advogado" && (
            <Link
              href="/tickets/manage"
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Painel do Advogado
            </Link>
          )}

          {isAuthenticated && profile === "regular" && (
            <Link
              href="/tickets/create"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Abrir Chamado
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">
                Bem-vindo(a), {userName || "Usuário"}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
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
