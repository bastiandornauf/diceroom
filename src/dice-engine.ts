// UNIVERSAL DICE ENGINE - Complete implementation according to specification
// Supports: NdS, +/-/*/(), kh/kl/dh/dl, !, r/ro, >=/>=/=/<, t>=, dF, dh, @variables

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
  // Success counting
  successes?: number;
  // Target number check
  target?: {
    op: string;
    value: number;
    pass: boolean;
  };
  // Daggerheart specific
  hope?: number;
  fear?: number;
  tag?: string; // 'Hope', 'Fear', 'Critical'
  // Variables used
  variables?: Record<string, number>;
}

// AST Node types
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
  sides: number | VariableNode;
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
  limit?: number; // for explode limit
}

// Tokenizer
export enum TokenType {
  NUMBER = 'NUMBER',
  VARIABLE = 'VARIABLE', // @NAME
  DICE = 'DICE', // d
  DAGGERHEART = 'DAGGERHEART', // dh
  FATE = 'FATE', // dF
  ADVANTAGE = 'ADVANTAGE', // a
  DISADVANTAGE = 'DISADVANTAGE', // d (in dh context)
  OPERATOR = 'OPERATOR', // +, -, *, /
  MODIFIER = 'MODIFIER', // kh, kl, dh, dl, !, r, ro
  COMPARISON = 'COMPARISON', // >=, >, =, <=, <
  TARGET = 'TARGET', // t>=, t>, t=, t<=, t<
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class DiceTokenizer {
  private input: string;
  private position: number = 0;
  private current: string | null = null;

  constructor(input: string) {
    this.input = input.toLowerCase().replace(/\s+/g, '');
    this.current = this.input[0] || null;
  }

  private advance(): void {
    this.position++;
    this.current = this.position < this.input.length ? this.input[this.position] : null;
  }

  private peek(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : null;
  }

  private readNumber(): string {
    let result = '';
    while (this.current && /\d/.test(this.current)) {
      result += this.current;
      this.advance();
    }
    return result;
  }

  private readVariable(): string {
    let result = '@';
    this.advance(); // skip @
    while (this.current && /[a-z_0-9]/.test(this.current)) {
      result += this.current;
      this.advance();
    }
    return result;
  }

  private readModifier(): string {
    let result = '';
    
    // Handle multi-character modifiers
    if (this.current === 'k' || this.current === 'd') {
      result += this.current;
      this.advance();
      if (this.current === 'h' || this.current === 'l') {
        result += this.current;
        this.advance();
      }
    } else if (this.current === 'r') {
      result += this.current;
      this.advance();
      if (this.current === 'o') {
        result += this.current;
        this.advance();
      }
    } else if (this.current === '!') {
      result += this.current;
      this.advance();
    }
    
    return result;
  }

  private readComparison(): string {
    let result = '';
    
    if (this.current === '>' || this.current === '<') {
      result += this.current;
      this.advance();
      if (this.current === '=') {
        result += this.current;
        this.advance();
      }
    } else if (this.current === '=') {
      result += this.current;
      this.advance();
    }
    
    return result;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.current !== null) {
      const startPos = this.position;
      
      if (/\d/.test(this.current)) {
        const value = this.readNumber();
        tokens.push({ type: TokenType.NUMBER, value, position: startPos });
      }
      else if (this.current === '@') {
        const value = this.readVariable();
        tokens.push({ type: TokenType.VARIABLE, value, position: startPos });
      }
      else if (this.current === 'd') {
        if (this.peek() === 'h') {
          this.advance(); // d
          this.advance(); // h
          tokens.push({ type: TokenType.DAGGERHEART, value: 'dh', position: startPos });
        } else if (this.peek() === 'f') {
          this.advance(); // d
          this.advance(); // f
          tokens.push({ type: TokenType.FATE, value: 'df', position: startPos });
        } else {
          tokens.push({ type: TokenType.DICE, value: 'd', position: startPos });
          this.advance();
        }
      }
      else if (this.current === 'a' && /\d|@/.test(this.peek() || '')) {
        tokens.push({ type: TokenType.ADVANTAGE, value: 'a', position: startPos });
        this.advance();
      }
      else if (this.current === 't' && (this.peek() === '>' || this.peek() === '<' || this.peek() === '=')) {
        tokens.push({ type: TokenType.TARGET, value: 't', position: startPos });
        this.advance();
      }
      else if (this.current === '+' || this.current === '-' || this.current === '*' || this.current === '/') {
        tokens.push({ type: TokenType.OPERATOR, value: this.current, position: startPos });
        this.advance();
      }
      else if (this.current === '(' ) {
        tokens.push({ type: TokenType.LPAREN, value: this.current, position: startPos });
        this.advance();
      }
      else if (this.current === ')') {
        tokens.push({ type: TokenType.RPAREN, value: this.current, position: startPos });
        this.advance();
      }
      else if (this.current === '>' || this.current === '<' || this.current === '=') {
        const value = this.readComparison();
        tokens.push({ type: TokenType.COMPARISON, value, position: startPos });
      }
      else if (this.current === 'k' || this.current === 'r' || this.current === '!') {
        const value = this.readModifier();
        tokens.push({ type: TokenType.MODIFIER, value, position: startPos });
      }
      else {
        // Skip unknown characters
        this.advance();
      }
    }
    
    tokens.push({ type: TokenType.EOF, value: '', position: this.position });
    return tokens;
  }
}

// Parser
export class DiceParser {
  private tokens: Token[];
  private position: number = 0;
  private variables: Record<string, number>;

  constructor(tokens: Token[], variables: Record<string, number> = {}) {
    this.tokens = tokens;
    this.variables = variables;
  }

  private current(): Token {
    return this.tokens[this.position] || { type: TokenType.EOF, value: '', position: 0 };
  }

  private advance(): Token {
    const token = this.current();
    this.position++;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type} at position ${token.position}`);
    }
    return this.advance();
  }

  private parseNumber(): NumberNode {
    const token = this.expect(TokenType.NUMBER);
    return { type: 'number', value: parseInt(token.value) };
  }

  private parseVariable(): VariableNode {
    const token = this.expect(TokenType.VARIABLE);
    return { type: 'variable', name: token.value.slice(1).toUpperCase() };
  }

  private parseAtom(): ASTNode {
    const token = this.current();
    
    switch (token.type) {
      case TokenType.NUMBER:
        return this.parseNumber();
        
      case TokenType.VARIABLE:
        return this.parseVariable();
        
      case TokenType.LPAREN:
        this.advance(); // consume (
        const expr = this.parseExpression();
        this.expect(TokenType.RPAREN);
        return expr;
        
      default:
        throw new Error(`Unexpected token ${token.type} at position ${token.position}`);
    }
  }

  private parseDiceModifiers(): DiceModifier[] {
    const modifiers: DiceModifier[] = [];
    
    while (this.current().type === TokenType.MODIFIER || this.current().type === TokenType.COMPARISON) {
      const token = this.current();
      
      if (token.type === TokenType.MODIFIER) {
        this.advance();
        
        switch (token.value) {
          case 'kh':
          case 'kl':
            const keepValue = this.current().type === TokenType.NUMBER ? 
              this.parseNumber() : this.parseVariable();
            modifiers.push({
              type: 'keep',
              variant: token.value === 'kh' ? 'high' : 'low',
              value: keepValue
            });
            break;
            
          case 'dh':
          case 'dl':
            const dropValue = this.current().type === TokenType.NUMBER ? 
              this.parseNumber() : this.parseVariable();
            modifiers.push({
              type: 'drop',
              variant: token.value === 'dh' ? 'high' : 'low',
              value: dropValue
            });
            break;
            
          case '!':
            let explodeCondition: DiceModifier = { type: 'explode' };
            
            // Check for explode condition (!>=8, !>6, etc.)
            if (this.current().type === TokenType.COMPARISON) {
              const op = this.advance().value;
              const value = this.current().type === TokenType.NUMBER ? 
                this.parseNumber() : this.parseVariable();
              explodeCondition.operator = op as '>=' | '>' | '=' | '<=' | '<';
              explodeCondition.value = value;
            }
            
            modifiers.push(explodeCondition);
            break;
            
          case 'r':
            const rerollCondition = this.current().type === TokenType.COMPARISON ?
              this.advance().value : '<=';
            const rerollValue = this.current().type === TokenType.NUMBER ? 
              this.parseNumber() : this.parseVariable();
            modifiers.push({
              type: 'reroll',
              variant: 'once',
              operator: rerollCondition as '>=' | '>' | '=' | '<=' | '<',
              value: rerollValue
            });
            break;
            
          case 'ro':
            const roCondition = this.current().type === TokenType.COMPARISON ?
              this.advance().value : '<=';
            const roValue = this.current().type === TokenType.NUMBER ? 
              this.parseNumber() : this.parseVariable();
            modifiers.push({
              type: 'reroll',
              operator: roCondition as '>=' | '>' | '=' | '<=' | '<',
              value: roValue
            });
            break;
        }
      } else if (token.type === TokenType.COMPARISON) {
        // Success counting (>=6, >4, =1, etc.)
        const op = this.advance().value;
        const value = this.current().type === TokenType.NUMBER ? 
          this.parseNumber() : this.parseVariable();
        modifiers.push({
          type: 'success',
          operator: op as '>=' | '>' | '=' | '<=' | '<',
          value: value
        });
      }
    }
    
    return modifiers;
  }

  private parseDice(): ASTNode {
    const token = this.current();
    
    if (token.type === TokenType.DAGGERHEART) {
      this.advance(); // consume 'dh'
      
      let advantages: number | VariableNode = 0;
      let disadvantages: number | VariableNode = 0;
      
      // Parse advantages (a2) and disadvantages (d1)
      while (this.current().type === TokenType.ADVANTAGE || 
             (this.current().type === TokenType.DICE && this.position > 0)) {
        
        if (this.current().type === TokenType.ADVANTAGE) {
          this.advance(); // consume 'a'
          advantages = this.current().type === TokenType.NUMBER ? 
            this.parseNumber().value : this.parseVariable();
        } else {
          this.advance(); // consume 'd'
          disadvantages = this.current().type === TokenType.NUMBER ? 
            this.parseNumber().value : this.parseVariable();
        }
      }
      
      const modifiers = this.parseDiceModifiers();
      
      return {
        type: 'daggerheart',
        advantages,
        disadvantages,
        modifiers
      } as DaggerheartNode;
    }
    
    // Regular dice (NdS) or Fate dice (dF)
    let count: number | VariableNode = 1;
    
    if (token.type === TokenType.NUMBER || token.type === TokenType.VARIABLE) {
      count = token.type === TokenType.NUMBER ? 
        this.parseNumber().value : this.parseVariable();
    }
    
    if (this.current().type === TokenType.DICE) {
      this.advance(); // consume 'd'
      
      let sides: number | VariableNode;
      if (this.current().type === TokenType.NUMBER) {
        sides = this.parseNumber().value;
      } else if (this.current().type === TokenType.VARIABLE) {
        sides = this.parseVariable();
      } else {
        throw new Error(`Expected number or variable for dice sides at position ${this.current().position}`);
      }
      
      const modifiers = this.parseDiceModifiers();
      
      return {
        type: 'dice',
        count,
        sides,
        modifiers
      } as DiceNode;
    }
    
    if (this.current().type === TokenType.FATE) {
      this.advance(); // consume 'dF'
      return {
        type: 'dice',
        count: typeof count === 'number' ? count : 4,
        sides: 'F' as any,
        modifiers: []
      } as DiceNode;
    }
    
    // Not a dice expression, parse as regular atom
    this.position -= count !== 1 ? 1 : 0; // backtrack if we consumed a number
    return this.parseAtom();
  }

  private parseFactor(): ASTNode {
    // Try to parse dice first, fall back to atom
    const checkpoint = this.position;
    
    try {
      return this.parseDice();
    } catch (e) {
      this.position = checkpoint;
      return this.parseAtom();
    }
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    
    while (this.current().type === TokenType.OPERATOR && 
           (this.current().value === '*' || this.current().value === '/')) {
      const op = this.advance().value as '*' | '/';
      const right = this.parseFactor();
      left = {
        type: 'binaryOp',
        operator: op,
        left,
        right
      } as BinaryOpNode;
    }
    
    return left;
  }

  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    
    while (this.current().type === TokenType.OPERATOR && 
           (this.current().value === '+' || this.current().value === '-')) {
      const op = this.advance().value as '+' | '-';
      const right = this.parseTerm();
      left = {
        type: 'binaryOp',
        operator: op,
        left,
        right
      } as BinaryOpNode;
    }
    
    return left;
  }

  private parseTarget(): ASTNode {
    let expr = this.parseExpression();
    
    if (this.current().type === TokenType.TARGET) {
      this.advance(); // consume 't'
      const op = this.expect(TokenType.COMPARISON).value;
      const value = this.current().type === TokenType.NUMBER ? 
        this.parseNumber().value : this.parseVariable();
      
      return {
        type: 'target',
        expression: expr,
        operator: op,
        value
      } as TargetNode;
    }
    
    return expr;
  }

  public parse(): ASTNode {
    const result = this.parseTarget();
    
    if (this.current().type !== TokenType.EOF) {
      throw new Error(`Unexpected token ${this.current().type} at position ${this.current().position}`);
    }
    
    return result;
  }
}

// Main function to parse dice expression
export function parseDiceExpression(expression: string, variables: Record<string, number> = {}): ASTNode {
  const tokenizer = new DiceTokenizer(expression);
  const tokens = tokenizer.tokenize();
  const parser = new DiceParser(tokens, variables);
  return parser.parse();
}
