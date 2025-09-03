// DICE EVALUATOR - Executes AST and produces results
// Implements the evaluation order: Roll → Reroll → Explode → Keep/Drop → Success/Sum → Arithmetic → Target

import {
  ASTNode, NumberNode, VariableNode, DiceNode, DaggerheartNode, BinaryOpNode, TargetNode,
  DiceResult, DiceRoll, DiceModifier
} from './dice-engine';

export class DiceEvaluator {
  private variables: Record<string, number>;
  private usedVariables: Record<string, number> = {};

  constructor(variables: Record<string, number> = {}) {
    this.variables = variables;
  }

  // Cryptographically secure random number generator
  private randomInt(min: number, max: number): number {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  }

  private rollDie(sides: number): number {
    if (sides === 'F' as any) {
      // Fate/Fudge die: -1, 0, +1
      const roll = this.randomInt(1, 3);
      return roll - 2; // 1->-1, 2->0, 3->+1
    }
    return this.randomInt(1, sides);
  }

  private resolveValue(value: number | VariableNode): number {
    if (typeof value === 'number') {
      return value;
    }
    
    const varValue = this.variables[value.name];
    if (varValue === undefined) {
      throw new Error(`Variable @${value.name} is not defined`);
    }
    
    this.usedVariables[value.name] = varValue;
    return varValue;
  }

  private compareRoll(roll: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>=': return roll >= target;
      case '>': return roll > target;
      case '=': return roll === target;
      case '<=': return roll <= target;
      case '<': return roll < target;
      default: return false;
    }
  }

  private applyModifiers(rolls: DiceRoll[], modifiers: DiceModifier[], sides: number): {
    finalRolls: DiceRoll[];
    successes?: number;
  } {
    let workingRolls = [...rolls];
    let successes: number | undefined;

    // Step 1: Rerolls (r, ro)
    for (const mod of modifiers.filter(m => m.type === 'reroll')) {
      const target = this.resolveValue(mod.value!);
      const operator = mod.operator || '<=';
      const isOnce = mod.variant === 'once';

      for (let i = 0; i < workingRolls.length; i++) {
        const roll = workingRolls[i];
        if (!roll.dropped && this.compareRoll(roll.result, operator, target)) {
          roll.rerolled = true;
          
          if (isOnce) {
            // Reroll once (r)
            const newRoll = this.rollDie(sides);
            workingRolls.push({
              sides,
              result: newRoll,
              rerolled: false
            });
          } else {
            // Reroll continuously (ro)
            let newRoll = this.rollDie(sides);
            while (this.compareRoll(newRoll, operator, target)) {
              workingRolls.push({
                sides,
                result: newRoll,
                rerolled: true
              });
              newRoll = this.rollDie(sides);
            }
            workingRolls.push({
              sides,
              result: newRoll,
              rerolled: false
            });
          }
        }
      }
    }

    // Step 2: Exploding dice (!)
    for (const mod of modifiers.filter(m => m.type === 'explode')) {
      const explodeOn = mod.value ? this.resolveValue(mod.value) : sides;
      const operator = mod.operator || '>=';
      const limit = mod.limit || 100; // Prevent infinite loops
      
      let explosions = 0;
      let i = 0;
      
      while (i < workingRolls.length && explosions < limit) {
        const roll = workingRolls[i];
        if (!roll.dropped && !roll.rerolled && this.compareRoll(roll.result, operator, explodeOn)) {
          roll.exploded = true;
          const newRoll = this.rollDie(sides);
          workingRolls.push({
            sides,
            result: newRoll,
            exploded: false
          });
          explosions++;
        }
        i++;
      }
    }

    // Step 3: Keep/Drop (kh, kl, dh, dl)
    for (const mod of modifiers.filter(m => m.type === 'keep' || m.type === 'drop')) {
      const count = this.resolveValue(mod.value!);
      const isHigh = mod.variant === 'high';
      const activeRolls = workingRolls.filter(r => !r.dropped && !r.rerolled);
      
      // Sort by result
      const sorted = [...activeRolls].sort((a, b) => 
        isHigh ? b.result - a.result : a.result - b.result
      );
      
      if (mod.type === 'keep') {
        // Keep the best/worst N, drop the rest
        const toKeep = sorted.slice(0, count);
        const toDrop = sorted.slice(count);
        
        for (const roll of toDrop) {
          const original = workingRolls.find(r => r === roll);
          if (original) original.dropped = true;
        }
      } else {
        // Drop the best/worst N, keep the rest
        const toDrop = sorted.slice(0, count);
        
        for (const roll of toDrop) {
          const original = workingRolls.find(r => r === roll);
          if (original) original.dropped = true;
        }
      }
    }

    // Step 4: Success counting or sum
    const successMod = modifiers.find(m => m.type === 'success');
    if (successMod) {
      const target = this.resolveValue(successMod.value!);
      const operator = successMod.operator || '>=';
      
      successes = 0;
      for (const roll of workingRolls) {
        if (!roll.dropped && !roll.rerolled) {
          if (this.compareRoll(roll.result, operator, target)) {
            roll.success = true;
            successes++;
          }
        }
      }
    }

    return { finalRolls: workingRolls, successes };
  }

  private evaluateDice(node: DiceNode): { value: number; rolls: DiceRoll[]; successes?: number } {
    const count = this.resolveValue(node.count);
    const sides = typeof node.sides === 'string' ? node.sides : this.resolveValue(node.sides);
    
    // Initial rolls
    const initialRolls: DiceRoll[] = [];
    for (let i = 0; i < count; i++) {
      initialRolls.push({
        sides: sides as number,
        result: this.rollDie(sides as number)
      });
    }

    // Apply modifiers
    const { finalRolls, successes } = this.applyModifiers(initialRolls, node.modifiers, sides as number);

    // Calculate final value
    let value: number;
    if (successes !== undefined) {
      value = successes;
    } else {
      // Sum active (non-dropped, non-rerolled) dice
      value = finalRolls
        .filter(r => !r.dropped && !r.rerolled)
        .reduce((sum, roll) => sum + roll.result, 0);
    }

    return { value, rolls: finalRolls, successes };
  }

  private evaluateDaggerheart(node: DaggerheartNode): { 
    value: number; 
    rolls: DiceRoll[]; 
    hope: number; 
    fear: number; 
    tag: string 
  } {
    const advantages = this.resolveValue(node.advantages);
    const disadvantages = this.resolveValue(node.disadvantages);

    // Base 2d12 roll
    const hope = this.rollDie(12);
    const fear = this.rollDie(12);
    const baseRolls: DiceRoll[] = [
      { sides: 12, result: hope },
      { sides: 12, result: fear }
    ];

    // Advantage dice (d6) - only highest counts
    const advantageRolls: DiceRoll[] = [];
    let maxAdvantage = 0;
    for (let i = 0; i < advantages; i++) {
      const roll = this.rollDie(6);
      advantageRolls.push({ sides: 6, result: roll });
      maxAdvantage = Math.max(maxAdvantage, roll);
    }

    // Disadvantage dice (d6) - only highest counts
    const disadvantageRolls: DiceRoll[] = [];
    let maxDisadvantage = 0;
    for (let i = 0; i < disadvantages; i++) {
      const roll = this.rollDie(6);
      disadvantageRolls.push({ sides: 6, result: roll });
      maxDisadvantage = Math.max(maxDisadvantage, roll);
    }

    // Calculate total: hope + fear + max(adv) - max(dis)
    const value = hope + fear + maxAdvantage - maxDisadvantage;

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

    const allRolls = [...baseRolls, ...advantageRolls, ...disadvantageRolls];

    return { value, rolls: allRolls, hope, fear, tag };
  }

  private evaluateNode(node: ASTNode): { value: number; rolls: DiceRoll[]; extra?: any } {
    switch (node.type) {
      case 'number':
        const numNode = node as NumberNode;
        return { value: numNode.value, rolls: [] };

      case 'variable':
        const varNode = node as VariableNode;
        const value = this.resolveValue(varNode);
        return { value, rolls: [] };

      case 'dice':
        const diceNode = node as DiceNode;
        const diceResult = this.evaluateDice(diceNode);
        return { 
          value: diceResult.value, 
          rolls: diceResult.rolls,
          extra: { successes: diceResult.successes }
        };

      case 'daggerheart':
        const dhNode = node as DaggerheartNode;
        const dhResult = this.evaluateDaggerheart(dhNode);
        return { 
          value: dhResult.value, 
          rolls: dhResult.rolls,
          extra: { hope: dhResult.hope, fear: dhResult.fear, tag: dhResult.tag }
        };

      case 'binaryOp':
        const binNode = node as BinaryOpNode;
        const left = this.evaluateNode(binNode.left);
        const right = this.evaluateNode(binNode.right);
        
        let result: number;
        switch (binNode.operator) {
          case '+': result = left.value + right.value; break;
          case '-': result = left.value - right.value; break;
          case '*': result = left.value * right.value; break;
          case '/': result = Math.floor(left.value / right.value); break;
        }
        
        return { 
          value: result, 
          rolls: [...left.rolls, ...right.rolls],
          extra: { ...left.extra, ...right.extra }
        };

      case 'target':
        const targetNode = node as TargetNode;
        const exprResult = this.evaluateNode(targetNode.expression);
        const targetValue = this.resolveValue(targetNode.value);
        const pass = this.compareRoll(exprResult.value, targetNode.operator, targetValue);
        
        return {
          value: exprResult.value,
          rolls: exprResult.rolls,
          extra: {
            ...exprResult.extra,
            target: {
              op: targetNode.operator,
              value: targetValue,
              pass
            }
          }
        };

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  public evaluate(ast: ASTNode, originalExpression: string): DiceResult {
    this.usedVariables = {};
    
    const result = this.evaluateNode(ast);
    
    // Build breakdown string
    let breakdown = this.buildBreakdown(result.rolls, result.value, result.extra);
    
    return {
      expression: originalExpression,
      total: result.value,
      breakdown,
      rolls: result.rolls,
      successes: result.extra?.successes,
      target: result.extra?.target,
      hope: result.extra?.hope,
      fear: result.extra?.fear,
      tag: result.extra?.tag,
      variables: this.usedVariables
    };
  }

  private buildBreakdown(rolls: DiceRoll[], total: number, extra: any): string {
    if (rolls.length === 0) {
      return `= ${total}`;
    }

    // Group rolls by sides
    const groups = new Map<number, DiceRoll[]>();
    for (const roll of rolls) {
      if (!groups.has(roll.sides)) {
        groups.set(roll.sides, []);
      }
      groups.get(roll.sides)!.push(roll);
    }

    const parts: string[] = [];
    
    for (const [sides, groupRolls] of groups) {
      const activeRolls = groupRolls.filter(r => !r.dropped && !r.rerolled);
      const droppedRolls = groupRolls.filter(r => r.dropped);
      const rerolledRolls = groupRolls.filter(r => r.rerolled);
      
      if (sides === 12 && extra?.hope !== undefined) {
        // Daggerheart display
        parts.push(`2d12: Hope(${extra.hope}) + Fear(${extra.fear})`);
      } else if (sides === 6 && groups.has(12)) {
        // Advantage/Disadvantage dice in Daggerheart
        const maxRoll = Math.max(...activeRolls.map(r => r.result));
        parts.push(`${activeRolls.length}d6: [${activeRolls.map(r => r.result).join(',')}] → max(${maxRoll})`);
      } else {
        // Regular dice
        let part = `${activeRolls.length}d${sides}`;
        
        if (activeRolls.length > 1) {
          const results = activeRolls.map(r => {
            let str = r.result.toString();
            if (r.exploded) str += '!';
            if (r.success) str += '✓';
            return str;
          });
          part += ` (${results.join(', ')})`;
        } else if (activeRolls.length === 1) {
          let str = activeRolls[0].result.toString();
          if (activeRolls[0].exploded) str += '!';
          if (activeRolls[0].success) str += '✓';
          part += ` (${str})`;
        }
        
        if (droppedRolls.length > 0) {
          part += ` drop(${droppedRolls.map(r => r.result).join(', ')})`;
        }
        
        parts.push(part);
      }
    }

    let breakdown = parts.join(' + ');
    
    if (extra?.successes !== undefined) {
      breakdown += ` = ${extra.successes} successes`;
    } else {
      breakdown += ` = ${total}`;
    }
    
    if (extra?.tag) {
      breakdown += ` [${extra.tag}]`;
    }
    
    if (extra?.target) {
      const t = extra.target;
      breakdown += ` vs ${t.op}${t.value} → ${t.pass ? 'PASS' : 'FAIL'}`;
    }
    
    return breakdown;
  }
}
