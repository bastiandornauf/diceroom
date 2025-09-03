// UNIVERSAL DICE SYSTEM - Main entry point
// Combines tokenizer, parser, and evaluator for complete dice notation support

import { parseDiceExpression } from './dice-engine';
import { DiceEvaluator } from './dice-evaluator';
import type { DiceResult } from './dice-engine';

/**
 * Roll dice using universal notation
 * 
 * Supported notation:
 * - Basic: NdS like 2d6, +/- like 1d20+5, brackets like (2d6+1)*2
 * - Keep/Drop: kh/kl/dh/dl like 4d6kh3, 6d6dl1
 * - Explode: ! like 3d6!, !>=N like 2d10!>=8, !x3 for limit
 * - Reroll: r<=N like 3d6r<=1, ro<=N for continuous
 * - Success: >=N like 5d10>=6, >N, =N, <=N, <N
 * - Target: t>=N like 1d20+5 t>=15
 * - Variables: @NAME like 1d20+@STR+@PROF
 * - Daggerheart: dh aN dN like dh a2 d1 + @BONUS t>=@TN
 * - Fate: NdF like 4dF
 * - Advantage/Disadvantage: adv d20, dis d20
 * 
 * @param expression Dice expression string
 * @param variables Variable values (e.g., { STR: 3, PROF: 2 })
 * @returns Detailed dice result with breakdown
 */
export function rollDiceUniversal(
  expression: string, 
  variables: Record<string, number> = {}
): DiceResult {
  try {
    // Handle special aliases
    const processedExpression = processAliases(expression.trim());
    
    // Parse expression into AST
    const ast = parseDiceExpression(processedExpression, variables);
    
    // Evaluate AST
    const evaluator = new DiceEvaluator(variables);
    const result = evaluator.evaluate(ast, expression);
    
    return result;
    
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

/**
 * Process common aliases and shortcuts
 */
function processAliases(expression: string): string {
  let processed = expression.toLowerCase();
  
  // Advantage/Disadvantage aliases
  processed = processed.replace(/\badv\s+d20\b/g, '2d20kh1');
  processed = processed.replace(/\bdis\s+d20\b/g, '2d20kl1');
  processed = processed.replace(/\badv\b/g, '2d20kh1');
  processed = processed.replace(/\bdis\b/g, '2d20kl1');
  
  // Normalize spacing around operators
  processed = processed.replace(/\s+/g, ' ');
  
  return processed;
}

/**
 * Validate dice expression without rolling
 */
export function validateDiceExpression(
  expression: string, 
  variables: Record<string, number> = {}
): { valid: boolean; error?: string } {
  try {
    const processedExpression = processAliases(expression.trim());
    parseDiceExpression(processedExpression, variables);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract variables used in expression
 */
export function extractVariables(expression: string): string[] {
  const variables: string[] = [];
  const regex = /@([A-Z_][A-Z0-9_]*)/gi;
  let match;
  
  while ((match = regex.exec(expression)) !== null) {
    const varName = match[1].toUpperCase();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}

/**
 * Get help text for dice notation
 */
export function getDiceHelp(): string {
  return `
Universal Dice Notation Help:

Basic Dice:
• NdS - Roll N dice with S sides (e.g., 2d6, 1d20)
• +/- - Add or subtract numbers (e.g., 2d6+3)
• ( ) - Group operations (e.g., (2d6+1)*2)

Modifiers:
• khN/klN - Keep highest/lowest N dice (e.g., 4d6kh3)
• dhN/dlN - Drop highest/lowest N dice (e.g., 6d6dl1)
• ! - Exploding dice (reroll max values)
• !>=N - Explode on N or higher
• r<=N - Reroll N or lower (once)
• ro<=N - Reroll N or lower (keep rerolling)

Success Counting:
• >=N - Count dice >= N as successes
• >N, =N, <=N, <N - Other comparisons

Target Numbers:
• t>=N - Check if total >= N (e.g., 1d20+5 t>=15)

Special Dice:
• adv/dis - Advantage/Disadvantage (2d20kh1/kl1)
• NdF - N Fate/Fudge dice (-1, 0, +1)
• dh aN dN - Daggerheart roll with advantages/disadvantages

Variables:
• @NAME - Reference variables (e.g., @STR, @DEX, @PROF)
• Variables are case-insensitive but displayed in UPPERCASE

Examples:
• 1d20+@STR+@PROF t>=15
• 4d6kh3
• 3d6!
• 5d10>=6
• dh a@ADV d@DIS + @BONUS t>=@TN
• adv + @DEX
• 4dF+@SKILL
`.trim();
}

/**
 * Generate example expressions for testing
 */
export const DICE_EXAMPLES = {
  basic: [
    '1d20',
    '2d6+3', 
    '4d6kh3',
    '1d20+5',
    '3d8'
  ],
  advanced: [
    '2d20kh1', // Advantage
    '2d20kl1', // Disadvantage
    '4d6!', // Exploding dice
    '6d6>=4', // Count successes
    '3d6r1', // Reroll 1s
    '10d10!>=8', // Exploding on 8+, count successes
    '4d6kh3+@STR+@PROF', // Variables
    '1d20+@DEX t>=15' // Target number
  ],
  daggerheart: [
    'dh', // Basic Daggerheart roll
    'dh a2', // With 2 advantage
    'dh d1', // With 1 disadvantage
    'dh a@ADV d@DIS', // With variables
    'dh a2 d1 + @STR', // With modifiers
    'dh a@ADV d@DIS + @BONUS t>=@TN' // Full example
  ],
  special: [
    '4dF', // Fate dice
    'adv', // Advantage alias
    'dis', // Disadvantage alias
    '2d10!>=8', // Exploding successes
    '6d6kl1' // Keep lowest
  ]
};

// Export everything for compatibility
export * from './dice-engine';
export * from './dice-evaluator';
