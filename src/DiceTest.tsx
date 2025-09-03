import { useState } from 'react';
import { rollDice, type DiceResult } from './dice';

export function DiceTest() {
  const [expression, setExpression] = useState('2d6');
  const [result, setResult] = useState<DiceResult | null>(null);

  const handleRoll = () => {
    const rollResult = rollDice(expression);
    setResult(rollResult);
  };

  const testExpression = (expr: string) => {
    setExpression(expr);
    const rollResult = rollDice(expr);
    setResult(rollResult);
  };

  const buttonStyle = {
    margin: '5px',
    padding: '8px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer' as const
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎲 DiceRoom - Dice Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter dice expression (e.g., 2d6, 1d20+5)"
          style={{
            padding: '10px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '200px'
          }}
        />
        <button
          onClick={handleRoll}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Roll Dice
        </button>
      </div>

      {result && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <h3>Result: {result.total}</h3>
          <p><strong>Expression:</strong> {result.expression}</p>
          <p><strong>Breakdown:</strong> {result.breakdown}</p>
          <p><strong>Individual Rolls:</strong> [{result.rolls.join(', ')}]</p>
          
          {/* Daggerheart specific display */}
          {(result.hope !== undefined || result.fear !== undefined || result.tag) && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
              <strong>Daggerheart:</strong>
              {result.hope && <span style={{ color: '#28a745', marginLeft: '10px' }}>Hope: {result.hope}</span>}
              {result.fear && <span style={{ color: '#dc3545', marginLeft: '10px' }}>Fear: {result.fear}</span>}
              {result.tag && <span style={{ color: '#6f42c1', marginLeft: '10px' }}>Tag: {result.tag}</span>}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Test Buttons:</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <h4>Basic Dice:</h4>
          {['1d20', '2d6', '3d8+2', '1d12-1'].map((expr) => (
            <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
              {expr}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4>RPG Features:</h4>
          {['adv', 'dis', '4d6kh3', '3d6!', '5d10>=6'].map((expr) => (
            <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
              {expr}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4>Daggerheart:</h4>
          {['dh', 'dh a2', 'dh d1', 'dh a2 d1', 'dh a3'].map((expr) => (
            <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
              {expr}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4>Special Dice:</h4>
          {['4dF', '2d10!>=8', '6d6kl1'].map((expr) => (
            <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
              {expr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
