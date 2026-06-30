import React, { useState } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import { LandingPage } from './components/LandingPage';
import { DashboardOverview } from './views/DashboardOverview';
import { SendPaymentFlow } from './views/SendPaymentFlow';
import { ExplorerComparison } from './views/ExplorerComparison';
import { CompliancePanel } from './views/CompliancePanel';
import { TreasuryOverview } from './views/TreasuryOverview';
import { 
  Shield, 
  LayoutGrid, 
  Send, 
  Eye, 
  Briefcase, 
  Lock,
  ChevronDown,
  LogOut
} from 'lucide-react';
import './App.css';

const DashboardApp: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    walletConnected, 
    walletAddress, 
    disconnectWallet 
  } = useSession();

  const [showDropdown, setShowDropdown] = useState(false);

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  // Helper to render current active view inside the dashboard
  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'send':
        return <SendPaymentFlow />;
      case 'explorer':
        return <ExplorerComparison />;
      case 'compliance':
        return <CompliancePanel />;
      case 'treasury':
        return <TreasuryOverview />;
      default:
        return <DashboardOverview />;
    }
  };

  // Gated Access Check: Render Landing Page if wallet is not connected
  if (!walletConnected) {
    return <LandingPage />;
  }

  return (
    <div className="app-container animate-fade-in">
      {/* Platform Top Header */}
      <header className="header">
        <div className="logo-section">
          <Shield size={24} className="logo-icon" />
          <span className="logo-text">ZBank</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
            zk-Stellar Protocol
          </span>
        </div>

        {/* Integrated Header Tabs for full-width navigation */}
        <nav className="header-nav">
          <button 
            className={`header-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutGrid size={14} />
            <span>Overview</span>
          </button>
          
          <button 
            className={`header-nav-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <Send size={14} />
            <span>Confidential Send</span>
          </button>

          <button 
            className={`header-nav-btn ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Eye size={14} />
            <span>ZK Explorer</span>
          </button>

          <button 
            className={`header-nav-btn ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            <Lock size={14} />
            <span>Compliance Panel</span>
          </button>

          <button 
            className={`header-nav-btn ${activeTab === 'treasury' ? 'active' : ''}`}
            onClick={() => setActiveTab('treasury')}
          >
            <Briefcase size={14} />
            <span>Treasury Solvency</span>
          </button>
        </nav>

        {/* Wallet connection controls */}
        <div className="header-actions" style={{ position: 'relative' }}>
          <div>
            <button 
              className="btn-secondary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                borderColor: 'rgba(243, 183, 36, 0.3)',
                backgroundColor: 'rgba(243, 183, 36, 0.04)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            {showDropdown && (
              <div 
                className="card-premium animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '200px',
                  padding: '8px',
                  zIndex: 20,
                  boxShadow: 'var(--card-shadow)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#111317'
                }}
              >
                <button
                  className="nav-item"
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '8px 12px',
                    color: 'var(--color-error)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left'
                  }}
                  onClick={handleDisconnect}
                >
                  <LogOut size={14} />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Structural Layout Area */}
      <main className="content-area">
        {renderActiveView()}
      </main>

      {/* Persistent Page Footer Status */}
      <footer 
        style={{ 
          padding: '1.25rem 4rem', 
          borderTop: '1px solid var(--border-color)', 
          textAlign: 'center', 
          fontSize: '0.7rem', 
          color: 'var(--color-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(10, 11, 13, 0.4)',
          zIndex: 5
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>ZK Prover (Noir): <strong style={{ color: 'var(--color-success)' }}>ACTIVE</strong></span>
          <span>Soroban Smart Engine: <strong style={{ color: 'var(--color-success)' }}>ONLINE</strong></span>
        </div>
        <div>
          <span>Institutional Trust Shield v1.2.0 • Stellar Testnet</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <DashboardApp />
    </SessionProvider>
  );
};

export default App;
