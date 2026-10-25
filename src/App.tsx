import React, { useState } from 'react';
import { User, RaceMode, Difficulty, Passage, RaceResult } from './types';
import { ApiService } from './services/api';
import { PASSAGES } from './data/passages';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RaceSetupPage } from './pages/RaceSetupPage';
import { RacePage } from './pages/RacePage';
import { ResultPage } from './pages/ResultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GaragePage } from './pages/GaragePage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MultiplayerLobbyPage } from './pages/MultiplayerLobbyPage';
import { useAuth } from './context/AuthContext';

export function App() {
  const { userProfile, refreshProfile } = useAuth();
  const [localUser, setLocalUser] = useState<User>(() => ApiService.getUser());
  const [activeTab, setActiveTab] = useState<string>('landing');

  const activeUser = userProfile || localUser;

  // Race Config State
  const [raceMode, setRaceMode] = useState<RaceMode>('ai');
  const [raceDifficulty, setRaceDifficulty] = useState<Difficulty>('intermediate');
  const [racePassage, setRacePassage] = useState<Passage>(PASSAGES[0]);
  const [raceCarId, setRaceCarId] = useState<string>(activeUser.equippedCarId);

  // Result State
  const [lastResult, setLastResult] = useState<RaceResult | null>(null);

  // Sync raceCarId whenever activeUser's equipped car changes
  React.useEffect(() => {
    if (activeUser.equippedCarId) {
      setRaceCarId(activeUser.equippedCarId);
    }
  }, [activeUser.equippedCarId]);

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      await ApiService.updateUserProfile(updatedUser);
    } catch (err) {
      console.error('[App] Failed to update user profile in Firestore:', err);
    }
    setLocalUser(updatedUser);
    if (updatedUser.equippedCarId) {
      setRaceCarId(updatedUser.equippedCarId);
    }
    await refreshProfile();
  };

  const handleLaunchRace = (mode: RaceMode, difficulty: Difficulty, passage: Passage, carId?: string) => {
    setRaceMode(mode);
    setRaceDifficulty(difficulty);
    setRacePassage(passage);
    setRaceCarId(carId || activeUser.equippedCarId || 'car-apex-racer');
    setActiveTab('race');
  };

  const handleFinishRace = async (result: RaceResult) => {
    setLastResult(result);
    try {
      const { user: updated } = await ApiService.saveRaceResult(result);
      setLocalUser(updated);
      await refreshProfile();
    } catch (err) {
      console.error('[App] Failed to save race result to Firestore:', err);
    } finally {
      setActiveTab('result');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      <Navbar user={activeUser} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {activeTab === 'landing' && (
          <LandingPage
            user={activeUser}
            onStartRace={() => setActiveTab('setup')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            user={activeUser}
            onStartRace={() => setActiveTab('setup')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'setup' && (
          <RaceSetupPage
            user={activeUser}
            onLaunchRace={handleLaunchRace}
            onNavigateToMultiplayer={() => setActiveTab('multiplayer')}
          />
        )}

        {activeTab === 'race' && (
          <RacePage
            user={activeUser}
            mode={raceMode}
            difficulty={raceDifficulty}
            passage={racePassage}
            carId={raceCarId || activeUser.equippedCarId || 'car-apex-racer'}
            onFinishRace={handleFinishRace}
            onCancelRace={() => setActiveTab('setup')}
          />
        )}

        {activeTab === 'result' && lastResult && (
          <ResultPage
            user={activeUser}
            result={lastResult}
            onRetry={() => setActiveTab('race')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'leaderboard' && <LeaderboardPage user={activeUser} />}

        {activeTab === 'garage' && <GaragePage user={activeUser} onUserUpdate={handleUserUpdate} />}

        {activeTab === 'achievements' && <AchievementsPage user={activeUser} />}

        {activeTab === 'profile' && <ProfilePage user={activeUser} onUserUpdate={handleUserUpdate} />}

        {activeTab === 'multiplayer' && (
          <MultiplayerLobbyPage user={activeUser} onStartMultiplayerRace={handleLaunchRace} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
