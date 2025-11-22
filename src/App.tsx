// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Authenticator,
  View,
  Heading,
  Button,
  Loader,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { get } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import { Dashboard } from './components/Dashboard';
import { UserSetup } from './components/UserSetup';
import { DonateFoodModal } from './components/DonateFoodModal';
import { RequestFoodModal } from './components/RequestFoodModal';

/* Custom header for Auth screens (keeps brand on login) */
function CustomAuthHeader() {
  return (
    <div className="auth-header">
      <div className="auth-header-inner">
        <img src="/logo.svg" alt="Food redistribution network logo" className="app-logo" />
        <div className="wordmark">
          <div className="title">Food Redistribution Network</div>
          <div className="subtitle">Connecting Food, Feeding Hope</div>
        </div>
      </div>
    </div>
  );
}

type UserProfile = {
  name: string | null;
  donationPoints?: number;
};

function AppHeader({
  onOpenDonate,
  onOpenRequest,
  setActiveView,
  signOut,
  points = 0,
  activeView,
}: {
  onOpenDonate: () => void;
  onOpenRequest: () => void;
  setActiveView: (v: 'map' | 'list' | 'my-requests' | 'my-donations') => void;
  signOut: () => void;
  points?: number;
  activeView: 'map' | 'list' | 'my-requests' | 'my-donations';
}) {
  const [showQuick, setShowQuick] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <header className="app-header" onMouseLeave={() => { setShowQuick(false); setShowViews(false); setShowActions(false); }}>
      <div className="container">
        <div className="header-left">
          <img src="/logo.svg" alt="Food redistribution network logo" className="app-logo" />
          <div className="wordmark">
            <div className="title">Food Redistribution Network</div>
            <div className="subtitle">Connecting Food, Feeding Hope</div>
          </div>
        </div>

        <div className="header-right">
          {/* Quick Actions */}
          <div className="dropdown" style={{ marginRight: 8 }}>
            <Button variation="primary" onClick={() => { setShowQuick(s => !s); setShowViews(false); setShowActions(false); }}>
              Quick Actions ▾
            </Button>
            {showQuick && (
              <div className="dropdown-menu" role="menu" aria-label="Quick actions menu">
                <Button variation="secondary" className="dropdown-btn" onClick={() => { setShowQuick(false); onOpenDonate(); }}>
                  Donate Food
                </Button>
                <Button variation="secondary" className="dropdown-btn" onClick={() => { setShowQuick(false); onOpenRequest(); }}>
                  Request Food
                </Button>
              </div>
            )}
          </div>

          {/* Views */}
          <div className="dropdown" style={{ marginRight: 8 }}>
            <Button onClick={() => { setShowViews(s => !s); setShowQuick(false); setShowActions(false); }}>
              Views ▾
            </Button>
            {showViews && (
              <div className="dropdown-menu" role="menu" aria-label="Views menu">
                <Button className={`dropdown-btn ${activeView === 'map' ? 'active' : ''}`} variation="secondary" onClick={() => { setShowViews(false); setActiveView('map'); }}>
                  Map View
                </Button>
                <Button className={`dropdown-btn ${activeView === 'list' ? 'active' : ''}`} variation="secondary" onClick={() => { setShowViews(false); setActiveView('list'); }}>
                  List View
                </Button>
              </div>
            )}
          </div>

          {/* My Actions (dropdown with My Requests + My Donations) */}
          <div className="dropdown" style={{ marginRight: 8 }}>
            <Button onClick={() => { setShowActions(s => !s); setShowQuick(false); setShowViews(false); }}>
              My Actions ▾
            </Button>
            {showActions && (
              <div className="dropdown-menu" role="menu" aria-label="My actions menu">
                <Button className={`dropdown-btn ${activeView === 'my-requests' ? 'active' : ''}`} variation="secondary" onClick={() => { setShowActions(false); setActiveView('my-requests'); }}>
                  My Requests
                </Button>
                <Button className={`dropdown-btn ${activeView === 'my-donations' ? 'active' : ''}`} variation="secondary" onClick={() => { setShowActions(false); setActiveView('my-donations'); }}>
                  My Donations
                </Button>
              </div>
            )}
          </div>

          {/* Points */}
          <div className="points" title="Earn points by donating food!" style={{ marginRight: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#ffd166" d="M12 4.5l1.8 3.6L18 9.1l-3 2.9.7 4.1L12 15.8 8.3 16.1l.7-4.1L6 9.1l4.2-1z" />
            </svg>
            <span style={{ marginLeft: 8, fontWeight: 700 }}>{points} Points</span>
          </div>

          <Button onClick={signOut} variation="link">Sign out</Button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Authenticator components={{ Header: CustomAuthHeader }}>
      {({ signOut }: WithAuthenticatorProps) => <MainApp signOut={signOut} />}
    </Authenticator>
  );
}

function MainApp({ signOut }: { signOut: () => void }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'my-requests' | 'my-donations'>('map');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const checkUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken;
      if (!idToken) throw new Error('No ID token found.');
      const restOperation = get({
        apiName: 'FoodWasteAPI',
        path: '/users/me',
        options: { headers: { Authorization: idToken.toString() } },
      });
      const { body } = await restOperation.response;
      const data = await body.json();
      setUserProfile(data);
    } catch {
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserProfile();
  }, [checkUserProfile]);

  if (isLoading) return <Loader />;
  if (!userProfile?.name) return <UserSetup onProfileComplete={checkUserProfile} />;

  return (
    <View>
      <AppHeader
        onOpenDonate={() => setShowDonateModal(true)}
        onOpenRequest={() => setShowRequestModal(true)}
        setActiveView={(v) => setActiveView(v)}
        signOut={signOut}
        points={userProfile.donationPoints ?? 0}
        activeView={activeView}
      />

      <div className="page">
        <div className="hero" style={{ textAlign: 'center', marginTop: 30 }}>
          <Heading level={1}>Welcome back, {userProfile.name}!</Heading>
          <div style={{ color: '#6b6b6b', marginBottom: 16 }}>Manage your food donations and help reduce waste.</div>
        </div>

        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <Dashboard
            activeViewFromParent={activeView}
            refreshSignal={refreshSignal}
          />
        </div>
      </div>

      <DonateFoodModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        onDonationSuccess={() => {
          setRefreshSignal(s => s + 1);
          setShowDonateModal(false);
          checkUserProfile();
        }}
      />

      <RequestFoodModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onRequestSuccess={() => {
          setRefreshSignal(s => s + 1);
          setShowRequestModal(false);
        }}
      />
    </View>
  );
}
