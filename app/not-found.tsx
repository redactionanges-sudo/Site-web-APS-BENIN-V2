import React from 'react';
import Link from 'next/link';
import { Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-[#92278F] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-[#FF8C00]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 font-heading">404</h1>
          <h2 className="text-xl font-bold text-gray-800">
            Page Introuvable / Page Not Found
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            La page que vous recherchez n'existe pas ou a été déplacée. / The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Home className="w-4 h-4 text-[#FF8C00]" />
            <span>Retour à l'accueil / Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
