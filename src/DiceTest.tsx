import { useState } from 'react';
import { rollDice, DICE_EXAMPLES, type DiceResult } from './dice-main';

export function DiceTest() {
  const [expression, setExpression] = useState('2d6');
  const [result, setResult] = useState<DiceResult | null>(null);

  const [variables, setVariables] = useState<Record<string, number>>({
    STR: 3,
    DEX: 2,
    CON: 1,
    PROF: 2,
    ADV: 1,
    DIS: 0,
    BONUS: 0,
    TN: 15
  });

  const handleRoll = () => {
    const rollResult = rollDice(expression, variables);
    setResult(rollResult);
  };

  const testExpression = (expr: string) => {
    setExpression(expr);
    const rollResult = rollDice(expr, variables);
    setResult(rollResult);
  };

  const buttonStyle = {
    margin: '5px',
    padding: '12px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    minHeight: '44px', // Mobile touch target
    fontSize: '16px', // Prevent zoom on iOS
    minWidth: '44px'
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      width: '100%' // Mobile: full width
    }}>
      <h1>🎲 DiceRoom - Dice Test</h1>
      
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter dice expression (e.g., 2d6, 1d20+5)"
          style={{
            padding: '12px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            width: '100%',
            fontSize: '16px', // Prevent zoom on iOS
            minHeight: '44px'
          }}
        />
        <button
          onClick={handleRoll}
          style={{
            padding: '12px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '44px',
            fontSize: '16px',
            width: '100%' // Mobile: full width
          }}
        >
          🎲 Roll Dice
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
          <p><strong>Individual Rolls:</strong> [
            {result.rolls.map((roll, index) => {
              let display = `d${roll.sides === -1 ? 'F' : roll.sides}:${roll.result}`;
              if (roll.exploded) display += '!';
              if (roll.dropped) display += '(dropped)';
              if (roll.rerolled) display += '(rerolled)';
              if (roll.success) display += '✓';
              return display;
            }).join(', ')}
          ]</p>
          
          {/* Variables used */}
          {result.variables && Object.keys(result.variables).length > 0 && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Variables:</strong>
              {Object.entries(result.variables).map(([name, value]) => (
                <span key={name} style={{ marginLeft: '10px' }}>@{name}={value}</span>
              ))}
            </div>
          )}
          
          {/* Target result */}
          {result.target && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: result.target.pass ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
              <strong>Target:</strong> {result.total} {result.target.op} {result.target.value} → 
              <span style={{ fontWeight: 'bold', color: result.target.pass ? '#155724' : '#721c24' }}>
                {result.target.pass ? 'PASS' : 'FAIL'}
              </span>
            </div>
          )}

          {/* Daggerheart specific display */}
          {(result.hope !== undefined || result.fear !== undefined || result.tag) && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
              <strong>Daggerheart:</strong>
              {result.hope !== undefined && <span style={{ color: '#28a745', marginLeft: '10px' }}>Hope: {result.hope}</span>}
              {result.fear !== undefined && <span style={{ color: '#dc3545', marginLeft: '10px' }}>Fear: {result.fear}</span>}
              {result.tag && <span style={{ color: '#6f42c1', marginLeft: '10px' }}>Tag: {result.tag}</span>}
            </div>
          )}
          
          {/* Success counting */}
          {result.successes !== undefined && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e2f3ff', borderRadius: '4px' }}>
              <strong>Successes:</strong> {result.successes}
            </div>
          )}
        </div>
      )}

      {/* Variables Panel */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3>Variables (used in expressions with @NAME):</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '15px',
          marginTop: '15px'
        }}>
          {Object.entries(variables).map(([name, value]) => (
            <div key={name}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 'bold',
                marginBottom: '5px',
                color: '#374151'
              }}>@{name}:</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setVariables(prev => ({ ...prev, [name]: parseInt(e.target.value) || 0 }))}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '44px'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Test Buttons:</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Basic Dice:</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '10px'
          }}>
            {DICE_EXAMPLES.basic.map((expr) => (
              <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
                {expr}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Advanced Features:</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '10px'
          }}>
            {DICE_EXAMPLES.advanced.map((expr) => (
              <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
                {expr}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Daggerheart:</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '10px'
          }}>
            {DICE_EXAMPLES.daggerheart.map((expr) => (
              <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
                {expr}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Special Dice:</h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '10px'
          }}>
            {DICE_EXAMPLES.special.map((expr) => (
              <button key={expr} onClick={() => testExpression(expr)} style={buttonStyle}>
                {expr}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
