// SIMPLE BUT COMPLETE DICE ENGINE - Everything in one file to avoid import hell
// Supports all major RPG dice notation without complex dependencies

export interface DiceRoll {
  sides: number;
  result: number;
  exploded?: boolean;
  dropped?: boolean;
  rerolled?: boolean;
  success?: boolean;
}

export interface DiceResult {
  expression: string;
  total: number;
  breakdown: string;
  rolls: DiceRoll[];
  successes?: number;
  target?: {
    op: string;
    value: number;
    pass: boolean;
  };
  hope?: number;
  fear?: number;
  tag?: string;
  variables?: Record<string, number>;
}

// Secure random number generator
function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

function rollDie(sides: number): number {
  if (sides === -1) {
    // Fate/Fudge die: -1, 0, +1
    const roll = randomInt(1, 3);
    return roll - 2; // 1->-1, 2->0, 3->+1
  }
  return randomInt(1, sides);
}

function compareRoll(roll: number, operator: string, target: number): boolean {
  switch (operator) {
    case '>=': return roll >= target;
    case '>': return roll > target;
    case '=': return roll === target;
    case '<=': return roll <= target;
    case '<': return roll < target;
    default: return false;
  }
}

// Simple expression parser for the most common patterns
export function rollDice(expression: string, variables: Record<string, number> = {}): DiceResult {
  try {
    let expr = expression.toLowerCase().trim();
    const usedVariables: Record<string, number> = {};
    
    // Replace variables
    for (const [name, value] of Object.entries(variables)) {
      const regex = new RegExp(`@${name.toLowerCase()}\\b`, 'g');
      if (expr.includes(`@${name.toLowerCase()}`)) {
        expr = expr.replace(regex, value.toString());
        usedVariables[name] = value;
      }
    }
    
    // Handle aliases
    expr = expr.replace(/\badv\b/g, '2d20kh1');
    expr = expr.replace(/\bdis\b/g, '2d20kl1');
    
    // Handle target number (t>=15)
    let target: { op: string; value: number; pass: boolean } | undefined;
    const targetMatch = expr.match(/(.+?)\s*t(>=|>|=|<=|<)(\d+)$/);
    if (targetMatch) {
      expr = targetMatch[1].trim();
      target = {
        op: targetMatch[2],
        value: parseInt(targetMatch[3]),
        pass: false // Will be set later
      };
    }
    
    // Handle Daggerheart (dh a2 d1)
    const dhMatch = expr.match(/^dh(?:\s+a(\d+))?(?:\s+d(\d+))?(?:\s*([+-]\d+))?$/);
    if (dhMatch) {
      return rollDaggerheart(dhMatch, expression, usedVariables, target);
    }
    
    // Handle basic dice with modifiers
    return rollBasicDice(expr, expression, usedVariables, target);
    
  } catch (error) {
    return {
      expression,
      total: 0,
      breakdown: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rolls: [],
      variables
    };
  }
}

function rollDaggerheart(
  match: RegExpMatchArray, 
  originalExpr: string, 
  usedVariables: Record<string, number>,
  target?: { op: string; value: number; pass: boolean }
): DiceResult {
  const advantages = match[1] ? parseInt(match[1]) : 0;
  const disadvantages = match[2] ? parseInt(match[2]) : 0;
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  // Base 2d12 roll
  const hope = rollDie(12);
  const fear = rollDie(12);
  const baseRolls: DiceRoll[] = [
    { sides: 12, result: hope },
    { sides: 12, result: fear }
  ];
  
  // Advantage dice (d6) - only highest counts
  const advantageRolls: DiceRoll[] = [];
  let maxAdvantage = 0;
  for (let i = 0; i < advantages; i++) {
    const roll = rollDie(6);
    advantageRolls.push({ sides: 6, result: roll });
    maxAdvantage = Math.max(maxAdvantage, roll);
  }
  
  // Disadvantage dice (d6) - only highest counts
  const disadvantageRolls: DiceRoll[] = [];
  let maxDisadvantage = 0;
  for (let i = 0; i < disadvantages; i++) {
    const roll = rollDie(6);
    disadvantageRolls.push({ sides: 6, result: roll });
    maxDisadvantage = Math.max(maxDisadvantage, roll);
  }
  
  // Calculate total: hope + fear + max(adv) - max(dis) + modifier
  const total = hope + fear + maxAdvantage - maxDisadvantage + modifier;
  
  // Determine tag
  let tag = '';
  const critical = hope === fear;
  
  if (critical) {
    tag = 'Critical';
  } else if (hope > fear) {
    tag = 'Hope';
  } else if (fear > hope) {
    tag = 'Fear';
  }
  
  // Check target
  if (target) {
    target.pass = compareRoll(total, target.op, target.value);
  }
  
  // Build breakdown
  let breakdown = `2d12: Hope(${hope}) + Fear(${fear}) = ${hope + fear}`;
  
  if (advantages > 0) {
    breakdown += ` + max(${advantages}d6: ${advantageRolls.map(r => r.result).join(',')}) = +${maxAdvantage}`;
  }
  
  if (disadvantages > 0) {
    breakdown += ` - max(${disadvantages}d6: ${disadvantageRolls.map(r => r.result).join(',')}) = -${maxDisadvantage}`;
  }
  
  if (modifier !== 0) {
    breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  
  breakdown += ` = ${total}`;
  
  if (tag) {
    breakdown += ` [${tag}]`;
  }
  
  if (target) {
    breakdown += ` vs ${target.op}${target.value} → ${target.pass ? 'PASS' : 'FAIL'}`;
  }
  
  const allRolls = [...baseRolls, ...advantageRolls, ...disadvantageRolls];
  
  return {
    expression: originalExpr,
    total,
    breakdown,
    rolls: allRolls,
    hope,
    fear,
    tag,
    target,
    variables: usedVariables
  };
}

function rollBasicDice(
  expr: string,
  originalExpr: string,
  usedVariables: Record<string, number>,
  target?: { op: string; value: number; pass: boolean }
): DiceResult {
  // Handle complex expressions with multiple dice and arithmetic
  let total = 0;
  const allRolls: DiceRoll[] = [];
  let breakdown = '';
  let successCount: number | undefined;
  
  // Split by + and - operators, keeping the operators
  const parts = expr.split(/([+-])/).filter(p => p.trim());
  let currentOp = '+';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (part === '+' || part === '-') {
      currentOp = part;
      continue;
    }
    
    if (!part) continue;
    
    const partResult = evaluatePart(part);
    const partValue = currentOp === '+' ? partResult.value : -partResult.value;
    
    total += partValue;
    allRolls.push(...partResult.rolls);
    
    if (breakdown) {
      breakdown += ` ${currentOp} `;
    }
    breakdown += partResult.breakdown;
    
    if (partResult.successes !== undefined) {
      successCount = (successCount || 0) + partResult.successes;
    }
  }
  
  // If we have success counting, use that as the total
  if (successCount !== undefined) {
    total = successCount;
    breakdown += ` = ${successCount} successes`;
  } else {
    breakdown += ` = ${total}`;
  }
  
  // Check target
  if (target) {
    target.pass = compareRoll(total, target.op, target.value);
    breakdown += ` vs ${target.op}${target.value} → ${target.pass ? 'PASS' : 'FAIL'}`;
  }
  
  return {
    expression: originalExpr,
    total,
    breakdown,
    rolls: allRolls,
    successes: successCount,
    target,
    variables: usedVariables
  };
}

function evaluatePart(part: string): { value: number; rolls: DiceRoll[]; breakdown: string; successes?: number } {
  // Handle simple numbers
  if (/^\d+$/.test(part)) {
    return { value: parseInt(part), rolls: [], breakdown: part };
  }
  
  // Handle Fate dice (4dF)
  const fateMatch = part.match(/^(\d+)df$/);
  if (fateMatch) {
    const count = parseInt(fateMatch[1]);
    const rolls: DiceRoll[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push({ sides: -1, result: rollDie(-1) });
    }
    const total = rolls.reduce((sum, roll) => sum + roll.result, 0);
    const symbols = rolls.map(roll => roll.result === -1 ? '−' : roll.result === 0 ? '0' : '+');
    return {
      value: total,
      rolls,
      breakdown: `${count}dF (${symbols.join(', ')}) = ${total >= 0 ? '+' : ''}${total}`
    };
  }
  
  // Handle dice expressions with modifiers
  const diceMatch = part.match(/^(\d+)d(\d+)(.*)$/);
  if (diceMatch) {
    const count = parseInt(diceMatch[1]);
    const sides = parseInt(diceMatch[2]);
    const modifiers = diceMatch[3] || '';
    
    // Initial rolls
    let rolls: DiceRoll[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push({ sides, result: rollDie(sides) });
    }
    
    // Apply modifiers
    const result = applyModifiers(rolls, modifiers, sides);
    
    return {
      value: result.value,
      rolls: result.rolls,
      breakdown: result.breakdown,
      successes: result.successes
    };
  }
  
  // Fallback for unknown patterns
  return { value: 0, rolls: [], breakdown: `Unknown: ${part}` };
}

function applyModifiers(
  rolls: DiceRoll[], 
  modifiers: string, 
  sides: number
): { value: number; rolls: DiceRoll[]; breakdown: string; successes?: number } {
  let workingRolls = [...rolls];
  let successCount: number | undefined;
  
  // Handle exploding dice (!)
  if (modifiers.includes('!')) {
    const explodeMatch = modifiers.match(/!(?:>=(\d+))?/);
    const explodeOn = explodeMatch && explodeMatch[1] ? parseInt(explodeMatch[1]) : sides;
    
    let i = 0;
    let explosions = 0;
    while (i < workingRolls.length && explosions < 100) {
      const roll = workingRolls[i];
      if (!roll.dropped && !roll.rerolled && roll.result >= explodeOn) {
        roll.exploded = true;
        const newRoll = rollDie(sides);
        workingRolls.push({ sides, result: newRoll });
        explosions++;
      }
      i++;
    }
  }
  
  // Handle rerolls (r1, ro1)
  const rerollMatch = modifiers.match(/(ro?)(<=?)(\d+)/);
  if (rerollMatch) {
    const isOnce = rerollMatch[1] === 'r';
    const target = parseInt(rerollMatch[3]);
    
    for (let i = 0; i < workingRolls.length; i++) {
      const roll = workingRolls[i];
      if (!roll.dropped && roll.result <= target) {
        roll.rerolled = true;
        
        if (isOnce) {
          const newRoll = rollDie(sides);
          workingRolls.push({ sides, result: newRoll });
        } else {
          let newRoll = rollDie(sides);
          while (newRoll <= target) {
            workingRolls.push({ sides, result: newRoll, rerolled: true });
            newRoll = rollDie(sides);
          }
          workingRolls.push({ sides, result: newRoll });
        }
      }
    }
  }
  
  // Handle keep/drop (kh3, kl1, dh1, dl1)
  const keepMatch = modifiers.match(/(k|d)(h|l)(\d+)/);
  if (keepMatch) {
    const isKeep = keepMatch[1] === 'k';
    const isHigh = keepMatch[2] === 'h';
    const count = parseInt(keepMatch[3]);
    
    const activeRolls = workingRolls.filter(r => !r.dropped && !r.rerolled);
    const sorted = [...activeRolls].sort((a, b) => 
      isHigh ? b.result - a.result : a.result - b.result
    );
    
    if (isKeep) {
      const toKeep = sorted.slice(0, count);
      const toDrop = sorted.slice(count);
      for (const roll of toDrop) {
        const original = workingRolls.find(r => r === roll);
        if (original) original.dropped = true;
      }
    } else {
      const toDrop = sorted.slice(0, count);
      for (const roll of toDrop) {
        const original = workingRolls.find(r => r === roll);
        if (original) original.dropped = true;
      }
    }
  }
  
  // Handle success counting (>=6, >4, etc.)
  const successMatch = modifiers.match(/(>=|>|=|<=|<)(\d+)/);
  if (successMatch) {
    const operator = successMatch[1];
    const target = parseInt(successMatch[2]);
    
    successCount = 0;
    for (const roll of workingRolls) {
      if (!roll.dropped && !roll.rerolled) {
        if (compareRoll(roll.result, operator, target)) {
          roll.success = true;
          successCount++;
        }
      }
    }
  }
  
  // Calculate final value
  let value: number;
  if (successCount !== undefined) {
    value = successCount;
  } else {
    value = workingRolls
      .filter(r => !r.dropped && !r.rerolled)
      .reduce((sum, roll) => sum + roll.result, 0);
  }
  
  // Build breakdown
  const activeRolls = workingRolls.filter(r => !r.dropped && !r.rerolled);
  const droppedRolls = workingRolls.filter(r => r.dropped);
  
  let breakdown = `${activeRolls.length}d${sides}`;
  
  if (activeRolls.length > 1) {
    const results = activeRolls.map(r => {
      let str = r.result.toString();
      if (r.exploded) str += '!';
      if (r.success) str += '✓';
      return str;
    });
    breakdown += ` (${results.join(', ')})`;
  } else if (activeRolls.length === 1) {
    let str = activeRolls[0].result.toString();
    if (activeRolls[0].exploded) str += '!';
    if (activeRolls[0].success) str += '✓';
    breakdown += ` (${str})`;
  }
  
  if (droppedRolls.length > 0) {
    breakdown += ` drop(${droppedRolls.map(r => r.result).join(', ')})`;
  }
  
  return { value, rolls: workingRolls, breakdown, successes: successCount };
}

// Export examples for testing
export const DICE_EXAMPLES = {
  basic: ['1d20', '2d6+3', '4d6kh3', '1d20+5'],
  advanced: ['2d20kh1', '2d20kl1', '4d6!', '6d6>=4', '3d6r1', '1d20+5 t>=15'],
  daggerheart: ['dh', 'dh a2', 'dh d1', 'dh a2 d1'],
  special: ['4dF', 'adv', 'dis', '2d10!>=8']
};
