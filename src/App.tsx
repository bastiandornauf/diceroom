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
    padding: '10px 20px',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    border: '1px solid #dee2e6',
    cursor: 'pointer',
    marginRight: '5px'
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎲 DiceRoom Development</h1>
      
      {/* PWA Status Indicators */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        fontSize: '14px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
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
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          style={tabStyle(currentTab === 'dice')}
          onClick={() => setCurrentTab('dice')}
        >
          Dice Engine Test
        </button>
        <button 
          style={tabStyle(currentTab === 'supabase')}
          onClick={() => setCurrentTab('supabase')}
        >
          Supabase Integration Test
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