// PURE TYPES - No functions, no imports, just type definitions
// This file has NO dependencies and can be imported safely everywhere

export interface DiceRoll {
  sides: number;
  result: number;
  exploded?: boolean;
  dropped?: boolean;
  rerolled?: boolean;
  success?: boolean;
  critical?: boolean;
  fumble?: boolean;
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
  needsLastMinuteVars?: Array<{name: string, label?: string, defaultValue?: number}>;
}

// AST Node types for advanced parsing
export interface ASTNode {
  type: string;
}

export interface NumberNode extends ASTNode {
  type: 'number';
  value: number;
}

export interface VariableNode extends ASTNode {
  type: 'variable';
  name: string;
}

export interface DiceNode extends ASTNode {
  type: 'dice';
  count: number | VariableNode;
  sides: number | VariableNode | string; // string for 'F' (Fate)
  modifiers: DiceModifier[];
}

export interface DaggerheartNode extends ASTNode {
  type: 'daggerheart';
  advantages: number | VariableNode;
  disadvantages: number | VariableNode;
  modifiers: DiceModifier[];
}

export interface BinaryOpNode extends ASTNode {
  type: 'binaryOp';
  operator: '+' | '-' | '*' | '/';
  left: ASTNode;
  right: ASTNode;
}

export interface TargetNode extends ASTNode {
  type: 'target';
  expression: ASTNode;
  operator: '>=' | '>' | '=' | '<=' | '<';
  value: number | VariableNode;
}

export interface DiceModifier {
  type: 'keep' | 'drop' | 'explode' | 'reroll' | 'success' | 'crit' | 'fumble';
  variant?: 'high' | 'low' | 'once';
  value?: number | VariableNode;
  operator?: '>=' | '>' | '=' | '<=' | '<';
  limit?: number;
  critValue?: number;
  fumbleValue?: number;
}

// Token types for parsing
export enum TokenType {
  NUMBER = 'NUMBER',
  VARIABLE = 'VARIABLE',
  DICE = 'DICE',
  DAGGERHEART = 'DAGGERHEART',
  FATE = 'FATE',
  ADVANTAGE = 'ADVANTAGE',
  DISADVANTAGE = 'DISADVANTAGE',
  OPERATOR = 'OPERATOR',
  MODIFIER = 'MODIFIER',
  COMPARISON = 'COMPARISON',
  TARGET = 'TARGET',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// Example collections
export const DICE_EXAMPLES = {
  basic: ['1d20', '2d6+3', '4d6kh3', '1d20+5'],
  advanced: ['2d20kh1', '2d20kl1', '4d6!', '6d6>=4', '3d6r1', '1d20+5 t>=15'],
  daggerheart: ['dh', 'dh a2', 'dh d1', 'dh a2 d1'],
  special: ['4dF', 'adv', 'dis', '2d10!>=8'],
  critfumble: ['6d12>=8 c1', '6d12<=3 f12', '6d12>=6 c1 f12', '4d20>=15 c20 f1'],
  lastminute: [
    '(?ATTRIB)d12>=(?SKILL)', 
    '(?BONUS)d6+5', 
    '(?DICE)d(?SIDES)>=(?TARGET)', 
    '(?COUNT)d12>=8 c1 f12',
    '(?ATTRIB=12)d12>=(?SKILL=8)', 
    '(?BONUS=3)d6+5', 
    '(?DICE=6)d(?SIDES=12)>=(?TARGET=8)',
    '(?COUNT=4)d12>=8 c1 f12',
    '(?ATTRIB|Attack_Defense)d12>=(?SKILL|Skill_Level)', 
    '(?BONUS|Damage_Bonus=3)d6+5', 
    '(?DICE|Dice_Count=6)d(?SIDES|Dice_Sides=12)>=(?TARGET|Target_Number=8)',
    '(?SKILLED=1|Skill_Learned)d12>=8 c(?SKILLED)'
  ]
};
