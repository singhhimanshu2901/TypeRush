import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { Edit3, Save, X, Loader2, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { WpmChart } from '../components/WpmChart';
import { UserAvatar } from '../components/UserAvatar';

interface ProfilePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => Promise<void> | void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Reset Stats Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmResetChecked, setConfirmResetChecked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const races = ApiService.getRaces();

  const handleStartEdit = () => {
    setUsername(user.username);
    setAvatar(user.avatar);
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setUsername(user.username);
    setAvatar(user.avatar);
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = username.trim();
    if (!trimmedName) {
      setSaveError('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedUser: User = {
        ...user,
        username: trimmedName,
        avatar: avatar,
      };

      await ApiService.updateUserProfile({
        username: trimmedName,
        avatar: avatar,
      });

      await onUserUpdate(updatedUser);

      setSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('[ProfilePage] Error saving profile:', err);
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to save profile. Please check your connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!confirmResetChecked || isResetting) return;

    setIsResetting(true);
    setResetError(null);

    try {
      console.log('[RaceDiag] handleConfirmReset entry. Resetting user stats...');
      const resetUser = await ApiService.resetUserStats();

      console.log('[RaceDiag] Calling onUserUpdate with resetUser profile...');
      await onUserUpdate(resetUser);

      console.log('[RaceDiag] Reset process completed successfully.');
      setSaveSuccess('All driving statistics and race history have been successfully reset.');
      setShowResetModal(false);
    } catch (err: unknown) {
      console.error('[RaceDiag] Error resetting stats in ProfilePage:', err);
      setResetError(
        err instanceof Error ? err.message : 'Failed to reset statistics. Please try again.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  const avatarPresets = ['🏎️', '⚡', '🤖', '🏁', '🔥', '🏆', '🚀', '🕶️'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-lg">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Driver ID Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex flex-col items-center">
            <UserAvatar
              avatar={avatar}
              alt={user.username}
              className="w-24 h-24 rounded-3xl bg-slate-950 border-2 border-rose-500/40 flex items-center justify-center text-5xl shadow-inner shrink-0 overflow-hidden"
              textClassName="text-5xl"
            />
            {isEditing && (
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center max-w-[240px] bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shadow-md">
                {avatarPresets.map((av) => (
                  <button
                    key={av}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setAvatar(av)}
                    className={`text-lg p-1 rounded-xl transition-all ${
                      avatar === av ? 'bg-rose-500/30 border border-rose-500 scale-110' : 'hover:scale-125'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0 w-full">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-3 w-full">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    disabled={isSaving}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={24}
                    placeholder="Enter display name"
                    className="bg-slate-950 border border-rose-500/80 focus:border-rose-500 font-bold text-lg text-white px-4 py-2 rounded-2xl outline-none w-full shadow-inner disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSaving || !username.trim()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-rose-600/30"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-3 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-black text-white truncate max-w-[220px] sm:max-w-[320px] md:max-w-[420px]">
                    {user.username}
                  </h1>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-rose-400 font-extrabold text-xs uppercase tracking-wider truncate">{user.title}</p>
                <p className="text-slate-400 text-xs font-medium truncate">
                  Driver Level {user.level} &bull; {user.xp} Total XP
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WPM Chart */}
      <WpmChart races={races} />

      {/* Settings / Danger Zone Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-200 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-500" /> Account Driving Statistics
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Reset competitive race records, XP, levels, achievements, and unlocked garage vehicles.
            </p>
          </div>
          <button
            onClick={() => {
              setConfirmResetChecked(false);
              setResetError(null);
              setShowResetModal(true);
            }}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" /> Reset All Stats
          </button>
        </div>
      </div>

      {/* Full Race Telemetry History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-extrabold text-base text-slate-200">Complete Track History</h3>

        {races.length === 0 ? (
          <p className="text-slate-500 text-sm">No races completed yet.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Passage</th>
                  <th className="py-3 px-4">Net WPM</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                {races.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 uppercase text-xs font-bold text-slate-400">{r.mode}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{r.passageTitle}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{r.netWpm} WPM</td>
                    <td className="py-3 px-4 font-bold text-cyan-400">{r.accuracy}%</td>
                    <td className="py-3 px-4 font-black text-amber-400">#{r.finishPosition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Reset Driving Statistics</h2>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Permanent Action</p>
                </div>
              </div>
              <button
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="text-slate-500 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="font-bold text-slate-200">
                Resetting statistics is separate from deleting your account:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>Your Google login credentials, display name, and avatar remain active.</li>
                <li>All race history records in Cloud Firestore and local storage will be cleared.</li>
                <li>XP, Level 1, WPM records, accuracy, streaks, and unlocked badges will reset.</li>
                <li>Unlocked garage vehicles will reset back to the starter vehicle.</li>
                <li className="text-slate-300 font-semibold">
                  Other drivers' records and global application data are never affected.
                </li>
              </ul>
            </div>

            {resetError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="confirmReset"
                disabled={isResetting}
                checked={confirmResetChecked}
                onChange={(e) => setConfirmResetChecked(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="confirmReset" className="text-xs text-slate-300 font-medium cursor-pointer">
                I understand that resetting my driving statistics cannot be undone.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmResetChecked || isResetting}
                onClick={handleConfirmReset}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-600/30"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
