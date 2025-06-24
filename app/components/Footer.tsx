"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold text-white mb-2">
              Portal Jurídico
            </h2>
            <p className="max-w-md text-gray-400">
              Informações jurídicas atualizadas e orientações confiáveis para
              todos os cidadãos brasileiros.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup/lawyer"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition duration-300"
            >
              📜 Quero Me Cadastrar Como Advogado
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} Portal Jurídico. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
