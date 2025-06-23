"use client";

import Link from "next/link";
import { useProvideAuth } from "../contexts/ProvideAuth";
import { useProfile } from "../contexts/ProvideProfile";
import { Scale, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { user, signOut, loading: authLoading } = useProvideAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  const isAuthenticated = !!user; // ✅ derive aqui mesmo

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/"); // volta para a LP
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 text-gray-600">
          Verificando sessão...
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Advogare</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated && profile ? (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>
                  {profile.firstName} {profile.lastName}
                </span>
                <span>({profile.role})</span>
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
      </div>
    </nav>
  );
}
