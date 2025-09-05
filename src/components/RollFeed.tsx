// RollFeed component
import { Dice6 } from 'lucide-react';
import type { Roll, Player, ColorId, DiceRoll, RollResult } from "../types"
import { COLOR_PALETTE } from "../types"

interface RollFeedProps {
  rolls: (Roll & { players: { name: string; color: string } })[];
  players: Player[];
}

export function RollFeed({ rolls, players }: RollFeedProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPlayerColor = (playerName: string) => {
    const player = players.find(p => p.displayName === playerName);
    if (!player) return 'bg-gray-500';
    const colorInfo = COLOR_PALETTE.find(c => c.id === player.colorId);
    return colorInfo ? colorInfo.class : 'bg-gray-500';
  };

  const renderRollResult = (result: DiceRoll) => {
    if (!result || typeof result !== 'object') return null;

    // Handle different roll types
    if ('total' in result && typeof result.total === 'number') {
      const rollResult = result as unknown as RollResult;
      
      return (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              Gesamt: {rollResult.total}
            </span>
            {rollResult.breakdown && (
              <span className="text-sm text-gray-400 font-mono">
                {rollResult.breakdown}
              </span>
            )}
          </div>
          
          {rollResult.details && rollResult.details.length > 0 && (
            <div className="space-y-1">
              {rollResult.details.map((detail, idx) => (
                <div key={idx} className="text-xs text-gray-300">
                  <span className="font-medium">{detail.type}:</span> {detail.result}
                  {detail.breakdown && (
                    <span className="text-gray-400 ml-1">({detail.breakdown})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle Daggerheart results
    if ('hope' in result || 'fear' in result) {
      return (
        <div className="mt-2">
          <div className="flex items-center space-x-4">
            {result.hope !== undefined && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-400 font-bold">Hope: {result.hope}</span>
              </div>
            )}
            {result.fear !== undefined && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-red-400 font-bold">Fear: {result.fear}</span>
              </div>
            )}
          </div>
          
          {result.total !== undefined && (
            <div className="mt-1">
              <span className="text-lg font-bold text-white">
                Gesamt: {result.total}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Fallback for unknown format
    return (
      <div className="mt-2 text-gray-300">
        <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  };

  if (rolls.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Dice6 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-sm">Noch keine Würfelwürfe</p>
        <p className="text-xs text-gray-600 mt-1">
          Würfel unten im Terminal um zu beginnen
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-h-full overflow-y-auto" style={{
      padding: '16px',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y'
    }}>
      {rolls.map((roll) => (
        <div
          key={roll.id}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${getPlayerColor(roll.players.name)}`}
              />
              <span className="font-medium text-white">{roll.players.name}</span>
            </div>
            <span className="text-xs text-gray-400">
              {formatTime(roll.created_at)}
            </span>
          </div>

          {/* Expression */}
          <div className="mb-2">
            <span className="text-sm text-gray-300 font-mono bg-gray-900 px-2 py-1 rounded">
              {roll.expression}
            </span>
          </div>

          {/* Result */}
          {renderRollResult(roll.result as DiceRoll)}
        </div>
      ))}
    </div>
  );
}