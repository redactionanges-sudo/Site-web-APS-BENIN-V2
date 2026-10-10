'use client';

import React from 'react';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  XCircle,
} from 'lucide-react';

export type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error';

export interface UploadProgressData {
  phase: UploadPhase;
  percent: number; // 0 to 100
  loadedBytes?: number;
  totalBytes?: number;
  fileName?: string;
  message?: string;
  error?: string;
}

interface UploadProgressBarProps {
  data: UploadProgressData | null;
  onReset?: () => void;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
  return `${Math.round(bytes / 1024)} Ko`;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  data,
  onReset,
  className = '',
}) => {
  if (!data || data.phase === 'idle') {
    return null;
  }

  const { phase, percent, loadedBytes, totalBytes, fileName, message, error } = data;

  const isUploading = phase === 'preparing' || phase === 'uploading' || phase === 'processing';
  const isSuccess = phase === 'success';
  const isError = phase === 'error';

  // Config per phase
  const phaseConfig = {
    idle: {
      label: 'En attente',
      color: 'bg-gray-200 text-gray-700',
      barColor: 'bg-gray-400',
      icon: <Upload className="w-4 h-4 text-gray-500" />,
    },
    preparing: {
      label: 'Préparation du fichier...',
      color: 'bg-purple-50 text-[#92278F] border-purple-200',
      barColor: 'bg-[#92278F]',
      icon: <Loader2 className="w-4 h-4 text-[#92278F] animate-spin" />,
    },
    uploading: {
      label: totalBytes
        ? `Téléversement (${percent}%) • ${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
        : `Téléversement en cours (${percent}%)...`,
      color: 'bg-purple-50 text-[#92278F] border-purple-200',
      barColor: 'bg-gradient-to-r from-[#92278F] to-[#FF8C00]',
      icon: <Loader2 className="w-4 h-4 text-[#FF8C00] animate-spin" />,
    },
    processing: {
      label: 'Enregistrement sur Supabase Storage...',
      color: 'bg-orange-50 text-[#FF8C00] border-orange-200',
      barColor: 'bg-[#FF8C00]',
      icon: <Loader2 className="w-4 h-4 text-[#FF8C00] animate-spin" />,
    },
    success: {
      label: message || 'Téléversement réussi et fichier enregistré !',
      color: 'bg-green-50 text-green-700 border-green-200',
      barColor: 'bg-green-600',
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    },
    error: {
      label: error || message || 'Échec du téléversement',
      color: 'bg-red-50 text-red-700 border-red-200',
      barColor: 'bg-red-600',
      icon: <AlertCircle className="w-4 h-4 text-red-600" />,
    },
  }[phase];

  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2.5 transition-all text-xs font-sans ${phaseConfig.color} ${className}`}
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression du téléversement"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{phaseConfig.icon}</span>
          <div className="min-w-0">
            {fileName && (
              <p className="font-bold text-gray-900 truncate text-[11px]">
                {fileName}
              </p>
            )}
            <p className="font-semibold text-xs leading-tight">
              {phaseConfig.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isUploading && (
            <span className="font-mono font-bold text-xs">
              {clampedPercent}%
            </span>
          )}

          {(isSuccess || isError) && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-semibold underline hover:opacity-80 transition-opacity ml-1"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-black/5 shadow-inner">
        <div
          className={`h-full transition-all duration-300 rounded-full ${phaseConfig.barColor}`}
          style={{ width: `${isUploading && clampedPercent === 0 ? 5 : clampedPercent}%` }}
        />
      </div>

      {isError && (
        <p className="text-[11px] text-red-600 leading-relaxed font-medium">
          {error || 'Une erreur réseau est survenue. Vérifiez votre connexion et réessayez.'}
        </p>
      )}
    </div>
  );
};
