import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, ShieldCheck, Flame, Zap, RefreshCw, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, signInWithGoogle, logout, importLocalProgress, loading } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    setImporting(true);
    await importLocalProgress();
    setImporting(false);
    setImportSuccess(true);
    setTimeout(() => setImportSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-500/20">
            🏎️
          </div>
          <h2 className="text-2xl font-black text-white">TYPE<span className="text-rose-500">RUSH</span> AUTHENTICATION</h2>
          <p className="text-xs text-slate-400 font-medium">
            Sign in with Google to sync driver stats, achievements, and track records across all devices.
          </p>
        </div>

        {currentUser ? (
          <div className="space-y-4 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-4">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-rose-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-xl font-bold">
                  {userProfile?.avatar || '🏎️'}
                </div>
              )}

              <div className="space-y-0.5">
                <div className="font-extrabold text-sm text-white">{currentUser.displayName}</div>
                <div className="text-xs text-slate-400">{currentUser.email}</div>
                <div className="text-[10px] font-bold text-rose-400">
                  Level {userProfile?.level || 1} &bull; {userProfile?.xp || 0} XP
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
                <span>Import Existing Local Progress to Account</span>
              </button>

              {importSuccess && (
                <p className="text-[11px] text-emerald-400 font-bold text-center">
                  ✅ Local progress merged into your cloud profile!
                </p>
              )}

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 text-center">
              🔒 Authenticated via official Firebase Auth. Credentials and passwords are never stored locally.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
