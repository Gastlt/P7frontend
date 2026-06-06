'use client';

import { X, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Configuración
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              APARIENCIA
            </h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Modo Oscuro
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === 'dark' ? 'Tema oscuro activado' : 'Tema claro activado'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'bg-red-500'
                    : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              OTRAS OPCIONES
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Más opciones de configuración próximamente...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
