import { useState, useEffect } from 'react';

interface LastMinuteDialogProps {
  variables: Array<{name: string, defaultValue?: number}>;
  onConfirm: (values: Record<string, number>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function LastMinuteDialog({ variables, onConfirm, onCancel, isOpen }: LastMinuteDialogProps) {
  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      // Initialize values with defaults or 0
      const initialValues: Record<string, number> = {};
      variables.forEach(variable => {
        initialValues[variable.name] = variable.defaultValue || 0;
      });
      setValues(initialValues);
    }
  }, [isOpen, variables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  const handleValueChange = (variableName: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [variableName]: parseInt(value) || 0
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '1.5rem'
        }}>
          🎲 Last Minute Variables
        </h2>
        
        <p style={{
          margin: '0 0 20px 0',
          color: '#666',
          fontSize: '14px'
        }}>
          Enter values for the following variables:
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            {variables.map(variable => (
              <div key={variable.name} style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  color: '#374151'
                }}>
                  {variable.name}:
                </label>
                <input
                  type="number"
                  value={values[variable.name] || 0}
                  onChange={(e) => handleValueChange(variable.name, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus={variable.name === variables[0]?.name}
                />
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                minHeight: '44px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                minHeight: '44px'
              }}
            >
              🎲 Roll Dice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}