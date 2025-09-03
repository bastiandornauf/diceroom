import { useState } from 'react';
import { isSupabaseConfigured } from './supabase';
import { RoomService, getColorById } from './services/room-service-simple';

export function SupabaseDemo() {
  const [status, setStatus] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('TestPlayer');

  const handleCreateRoom = async () => {
    setStatus('Creating room...');
    
    const result = await RoomService.createRoom({
      name: 'Test Room',
      systemPreset: 'daggerheart',
      playerName: playerName
    });

    if (result.error) {
      setStatus(`Error: ${result.error.message}`);
    } else {
      setStatus(`Room created successfully! Join code: ${result.room?.join_code}`);
      setRoom(result.room);
      setPlayer(result.player);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setStatus('Please enter a join code');
      return;
    }

    setStatus('Joining room...');
    
    const result = await RoomService.joinRoom({
      joinCode: joinCode.trim(),
      playerName: playerName
    });

    if (result.error) {
      setStatus(`Error: ${result.error.message}`);
    } else {
      setStatus(`Joined room successfully!`);
      setRoom(result.room);
      setPlayer(result.player);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🎲 DiceRoom - Supabase Integration Test</h2>
      
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: isConfigured ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isConfigured ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <strong>Supabase Status:</strong> {isConfigured ? '✅ Configured' : '⚠️ Not Configured (Demo Mode)'}
        <br />
        {!isConfigured && (
          <small>
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable real database
          </small>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Player Setup</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Player Name: </label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Create Room</h3>
        <button 
          onClick={handleCreateRoom}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create New Room
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Join Room</h3>
        <div>
          <input 
            type="text" 
            placeholder="Enter join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            style={{ padding: '5px', marginRight: '10px' }}
          />
          <button 
            onClick={handleJoinRoom}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Join Room
          </button>
        </div>
      </div>

      {status && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      {room && player && (
        <div style={{ 
          padding: '15px',
          backgroundColor: '#e2f3ff',
          border: '1px solid #b8daff',
          borderRadius: '4px'
        }}>
          <h3>Current Session</h3>
          <p><strong>Room:</strong> {room.name} (ID: {room.id})</p>
          <p><strong>Join Code:</strong> {room.join_code}</p>
          <p><strong>Player:</strong> {player.display_name}</p>
          <p><strong>Role:</strong> {player.role}</p>
          <p>
            <strong>Color:</strong> 
            <span style={{ 
              display: 'inline-block',
              width: '20px',
              height: '20px',
              backgroundColor: getColorById(player.color_id),
              marginLeft: '10px',
              border: '1px solid #ccc',
              borderRadius: '3px'
            }}></span>
            {getColorById(player.color_id)}
          </p>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <h4>Next Steps:</h4>
        <ul>
          <li>Set up Supabase project and add credentials to .env.local</li>
          <li>Run the SQL schema in your Supabase dashboard</li>
          <li>Enable RLS policies</li>
          <li>Test real-time features</li>
        </ul>
      </div>
    </div>
  );
}
