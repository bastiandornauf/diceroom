import { useState } from 'react';
import { DiceTest } from './DiceTest';
import { SupabaseDemo } from './SupabaseDemo';
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState<'dice' | 'supabase'>('dice');

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
    </div>
  )
}

export default App