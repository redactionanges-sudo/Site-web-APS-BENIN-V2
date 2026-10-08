'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore, isSupabaseConfigured } from '@/lib/supabase';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Code2,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDatabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });
  const [testing, setTesting] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/supabase-schema.sql')
      .then((res) => res.text())
      .then(setSqlContent)
      .catch((err) => console.error(err));
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await supabaseStore.testConnection();
    setConnectionStatus({
      tested: true,
      success: result.success,
      message: result.message,
    });
    setTesting(false);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AdminAuthGuard requireSuperAdmin>
      <AdminHeader
        title="Base de Données & Schéma Supabase"
        subtitle="Vérification de la connectivité Supabase PostgreSQL et script de migration SQL"
      />

      <main className="p-6 max-w-5xl space-y-6">
        {/* Connection Diagnostics Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#92278F]" />
              <span>État de Connexion Backend</span>
            </h2>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>Tester la connexion Supabase</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Configuration des clés :</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isSupabaseConfigured
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-[#92278F]'
                }`}
              >
                {isSupabaseConfigured
                  ? 'Variables Détectées'
                  : 'Mode Persistance Locale Réactive'}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed">
              Le site APS-BÉNIN est conçu pour fonctionner de manière autonome et réactive. Lorsque vous renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, les requêtes s'exécutent directement sur votre projet Supabase PostgreSQL.
            </p>

            {connectionStatus.tested && (
              <div
                className={`p-3 rounded-lg border mt-3 text-xs flex items-start gap-2.5 ${
                  connectionStatus.success
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-orange-50 border-orange-200 text-orange-800'
                }`}
              >
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold">
                    {connectionStatus.success ? 'Succès de la connexion' : 'Information'}
                  </strong>
                  <span>{connectionStatus.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SQL Schema Viewer */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#FF8C00]" />
                <span>Script de Migration SQL Supabase (PostgreSQL + RLS)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase (SQL Editor).
              </p>
            </div>

            <button
              type="button"
              onClick={copySql}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors border border-gray-300"
            >
              <Copy className="w-3.5 h-3.5 text-[#92278F]" />
              <span>{copied ? 'Copié !' : 'Copier tout le SQL'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-gray-950 text-gray-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 border border-gray-800">
              {sqlContent || 'Chargement du fichier SQL...'}
            </pre>
          </div>
        </div>
      </main>
    </AdminAuthGuard>
  );
}
