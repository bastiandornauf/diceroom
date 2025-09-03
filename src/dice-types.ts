// PURE TYPES - No functions, no imports, just type definitions
// This file has NO dependencies and can be imported safely everywhere

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
  type: 'keep' | 'drop' | 'explode' | 'reroll' | 'success';
  variant?: 'high' | 'low' | 'once';
  value?: number | VariableNode;
  operator?: '>=' | '>' | '=' | '<=' | '<';
  limit?: number;
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
  special: ['4dF', 'adv', 'dis', '2d10!>=8']
};
