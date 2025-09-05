import { useState } from 'react';
import { DiceTest } from './DiceTest';
import { SupabaseDemo } from './SupabaseDemo';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { usePWA } from './hooks/usePWA';
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState<'dice' | 'supabase'>('dice');
  const { isOnline, isInstalled, updateAvailable, updateApp } = usePWA();

  const tabStyle = (isActive: boolean) => ({
    padding: '12px 20px',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    border: '1px solid #dee2e6',
    cursor: 'pointer',
    marginRight: '5px',
    borderRadius: '8px',
    minHeight: '44px', // Mobile touch target
    fontSize: '16px', // Prevent zoom on iOS
    flex: '1', // Mobile: equal width buttons
    textAlign: 'center' as const
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Mobile Navigation */}
      <div className="mobile-nav" style={{ 
        display: 'none', // Hidden on desktop
        position: 'sticky',
        top: 0,
        background: 'white',
        zIndex: 100,
        padding: '1rem',
        margin: '-20px -20px 20px -20px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🎲 DiceRoom</h1>
      </div>
      
      <h1 style={{ 
        fontSize: '3.2em',
        lineHeight: '1.1',
        marginBottom: '1rem'
      }}>🎲 DiceRoom Development</h1>
      
      {/* PWA Status Indicators */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '12px',
        fontSize: '14px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap' // Mobile: wrap items
      }}>
        <span style={{ color: isOnline ? '#28a745' : '#dc3545' }}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
        {isInstalled && <span style={{ color: '#28a745' }}>📱 App installiert</span>}
        {updateAvailable && (
          <button 
            onClick={updateApp}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Update verfügbar - Jetzt aktualisieren
          </button>
        )}
      </div>
      
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap' // Mobile: wrap buttons
      }}>
        <button 
          style={tabStyle(currentTab === 'dice')}
          onClick={() => setCurrentTab('dice')}
        >
          🎲 Dice Test
        </button>
        <button 
          style={tabStyle(currentTab === 'supabase')}
          onClick={() => setCurrentTab('supabase')}
        >
          🏠 Room Test
        </button>
      </div>

      {currentTab === 'dice' && <DiceTest />}
      {currentTab === 'supabase' && <SupabaseDemo />}
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

export default App