// SIMPLE DICE ENGINE - No complex imports, just pure functionality

export interface DiceResult {
  expression: string;
  total: number;
  breakdown: string;
  rolls: number[];
  // Daggerheart specific fields
  hope?: number;
  fear?: number;
  tag?: string; // 'Hope', 'Fear', 'Critical'
}

// Enhanced dice rolling function with RPG features
export function rollDice(expression: string): DiceResult {
  try {
    const cleanExpr = expression.trim().toLowerCase();
    
    // Handle advantage/disadvantage (adv/dis)
    if (cleanExpr.includes('adv')) {
      return rollAdvantage(cleanExpr);
    }
    if (cleanExpr.includes('dis')) {
      return rollDisadvantage(cleanExpr);
    }
    
    // Handle keep highest/lowest (4d6kh3, 4d6kl1)
    const keepMatch = cleanExpr.match(/(\d+)d(\d+)k([hl])(\d+)([+-]\d+)?/);
    if (keepMatch) {
      return rollWithKeep(keepMatch, expression);
    }
    
    // Handle exploding dice (3d6!, 2d10!>=8)
    const explodeMatch = cleanExpr.match(/(\d+)d(\d+)(!(?:>=\d+)?)([+-]\d+)?/);
    if (explodeMatch) {
      return rollExploding(explodeMatch, expression);
    }
    
    // Handle success counting (5d10>=6)
    const successMatch = cleanExpr.match(/(\d+)d(\d+)>=(\d+)([+-]\d+)?/);
    if (successMatch) {
      return rollSuccesses(successMatch, expression);
    }
    
    // Handle Daggerheart dice (dh, dh a2, dh d1, dh a2 d1)
    if (cleanExpr.includes('dh')) {
      return rollDaggerheart(cleanExpr, expression);
    }
    
    // Handle Fate/Fudge dice (4dF)
    if (cleanExpr.includes('df') || cleanExpr.includes('4df')) {
      return rollFate(expression);
    }
    
    // Basic XdY+Z pattern
    const basicMatch = cleanExpr.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (basicMatch) {
      return rollBasic(basicMatch, expression);
    }
    
    throw new Error('Invalid dice expression');
    
  } catch (error) {
    return {
      expression,
      total: 0,
      breakdown: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rolls: []
    };
  }
}

function rollBasic(match: RegExpMatchArray, expression: string): DiceResult {
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const rolls = Array.from({ length: count }, () => 
    Math.floor(Math.random() * sides) + 1
  );
  
  const rollTotal = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = rollTotal + modifier;
  
  let breakdown = `${count}d${sides} (${rolls.join(', ')})`;
  if (modifier !== 0) {
    breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  breakdown += ` = ${total}`;
  
  return { expression, total, breakdown, rolls };
}

function rollAdvantage(expr: string): DiceResult {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  const total = Math.max(roll1, roll2);
  
  return {
    expression: expr,
    total,
    breakdown: `Advantage: d20 (${roll1}, ${roll2}) = ${total}`,
    rolls: [roll1, roll2]
  };
}

function rollDisadvantage(expr: string): DiceResult {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  const total = Math.min(roll1, roll2);
  
  return {
    expression: expr,
    total,
    breakdown: `Disadvantage: d20 (${roll1}, ${roll2}) = ${total}`,
    rolls: [roll1, roll2]
  };
}

function rollWithKeep(match: RegExpMatchArray, expression: string): DiceResult {
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const keepType = match[3]; // 'h' or 'l'
  const keepCount = parseInt(match[4]);
  const modifier = match[5] ? parseInt(match[5]) : 0;
  
  const rolls = Array.from({ length: count }, () => 
    Math.floor(Math.random() * sides) + 1
  );
  
  const sortedRolls = [...rolls].sort((a, b) => b - a);
  const keptRolls = keepType === 'h' 
    ? sortedRolls.slice(0, keepCount)
    : sortedRolls.slice(-keepCount);
  
  const total = keptRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  let breakdown = `${count}d${sides}k${keepType}${keepCount} (${rolls.join(', ')}) keep (${keptRolls.join(', ')})`;
  if (modifier !== 0) {
    breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  breakdown += ` = ${total}`;
  
  return { expression, total, breakdown, rolls };
}

function rollExploding(match: RegExpMatchArray, expression: string): DiceResult {
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const explodeCondition = match[3];
  const modifier = match[4] ? parseInt(match[4]) : 0;
  
  const explodeOn = explodeCondition.includes('>=') 
    ? parseInt(explodeCondition.slice(3))
    : sides;
  
  const allRolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    let roll = Math.floor(Math.random() * sides) + 1;
    allRolls.push(roll);
    
    // Keep rolling while exploding
    while (roll >= explodeOn) {
      roll = Math.floor(Math.random() * sides) + 1;
      allRolls.push(roll);
    }
  }
  
  const total = allRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  let breakdown = `${count}d${sides}${explodeCondition} (${allRolls.join(', ')})`;
  if (modifier !== 0) {
    breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
  }
  breakdown += ` = ${total}`;
  
  return { expression, total, breakdown, rolls: allRolls };
}

function rollSuccesses(match: RegExpMatchArray, expression: string): DiceResult {
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const target = parseInt(match[3]);
  
  const rolls = Array.from({ length: count }, () => 
    Math.floor(Math.random() * sides) + 1
  );
  
  const successes = rolls.filter(roll => roll >= target).length;
  
  const breakdown = `${count}d${sides}>=${target} (${rolls.join(', ')}) = ${successes} successes`;
  
  return { expression, total: successes, breakdown, rolls };
}

function rollDaggerheart(cleanExpr: string, expression: string): DiceResult {
  // Parse advantage/disadvantage: "dh a2 d1" or "dh a2" or "dh d1" or just "dh"
  const advMatch = cleanExpr.match(/a(\d+)/);
  const disMatch = cleanExpr.match(/d(\d+)/);
  
  const advantages = advMatch ? parseInt(advMatch[1]) : 0;
  const disadvantages = disMatch ? parseInt(disMatch[1]) : 0;
  
  // Base 2d12 roll - KORREKT: hope = d12_1, fear = d12_2
  const hope = Math.floor(Math.random() * 12) + 1;
  const fear = Math.floor(Math.random() * 12) + 1;
  const baseRolls = [hope, fear];
  
  // Roll advantage dice (d6) - nur höchster wird verwendet
  const advantageRolls: number[] = [];
  for (let i = 0; i < advantages; i++) {
    advantageRolls.push(Math.floor(Math.random() * 6) + 1);
  }
  const maxAdvantage = advantageRolls.length > 0 ? Math.max(...advantageRolls) : 0;
  
  // Roll disadvantage dice (d6) - nur höchster wird verwendet  
  const disadvantageRolls: number[] = [];
  for (let i = 0; i < disadvantages; i++) {
    disadvantageRolls.push(Math.floor(Math.random() * 6) + 1);
  }
  const maxDisadvantage = disadvantageRolls.length > 0 ? Math.max(...disadvantageRolls) : 0;
  
  // KORREKTE FORMEL: hope + fear + max(advantage) - max(disadvantage)
  const total = hope + fear + maxAdvantage - maxDisadvantage;
  
  // Korrekte Tag-Logik
  let tag = '';
  const critical = hope === fear;
  
  if (critical) {
    tag = 'Critical';
  } else if (hope > fear) {
    tag = 'Hope';
  } else if (fear > hope) {
    tag = 'Fear';
  }
  
  // Build breakdown string
  let breakdown = `2d12: Hope(${hope}) + Fear(${fear}) = ${hope + fear}`;
  
  if (advantages > 0) {
    breakdown += ` + max(${advantages}d6: ${advantageRolls.join(',')}) = +${maxAdvantage}`;
  }
  
  if (disadvantages > 0) {
    breakdown += ` - max(${disadvantages}d6: ${disadvantageRolls.join(',')}) = -${maxDisadvantage}`;
  }
  
  breakdown += ` = ${total}`;
  
  if (tag) {
    breakdown += ` [${tag}]`;
  }
  
  const allRolls = [...baseRolls, ...advantageRolls, ...disadvantageRolls];
  
  return {
    expression,
    total,
    breakdown,
    rolls: allRolls,
    hope,
    fear,
    tag
  };
}

function rollFate(expression: string): DiceResult {
  const rolls = Array.from({ length: 4 }, () => {
    const rand = Math.random();
    if (rand < 0.33) return -1;
    if (rand < 0.67) return 0;
    return 1;
  });
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0);
  const symbols = rolls.map(roll => roll === -1 ? '−' : roll === 0 ? '0' : '+');
  
  const breakdown = `4dF (${symbols.join(', ')}) = ${total >= 0 ? '+' : ''}${total}`;
  
  return { expression, total, breakdown, rolls };
}

// Test function
export function testDice() {
  console.log('Testing dice engine:');
  console.log(rollDice('2d6'));
  console.log(rollDice('1d20+5'));
  console.log(rollDice('3d8-2'));
}
