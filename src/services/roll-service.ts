import { supabase, safeQuery } from '../supabase';
import { rollDice } from '../dice-main';
import type { Roll, RollInsert, RollRequest, RollRequestInsert } from '../types/database';
import type { DiceResult } from '../dice-types';

export interface CreateRollOptions {
  roomId: string;
  expression: string;
  variables?: Record<string, number>;
  visibility?: 'public' | 'gm' | 'whisper';
  recipients?: string[];
  requestId?: string;
}

export interface CreateRollRequestOptions {
  roomId: string;
  label: string;
  expression: string;
  recipients?: string[];
  visibility?: 'public' | 'gm';
}

export class RollService {
  
  /**
   * Create and save a dice roll
   */
  static async createRoll(options: CreateRollOptions): Promise<{ roll: Roll | null; error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { roll: null, error: new Error('User not authenticated') };
    }

    // Verify user is in the room
    const playerCheck = await safeQuery(() =>
      supabase.from('players')
        .select('role')
        .eq('room_id', options.roomId)
        .eq('user_id', user.data.user!.id)
        .single()
    );

    if (playerCheck.error || !playerCheck.data) {
      return { roll: null, error: new Error('User not in room') };
    }

    // Perform the dice roll
    const diceResult = rollDice(options.expression, options.variables || {});
    
    // Generate client hash for audit trail
    const clientHash = await this.generateRollHash({
      userId: user.data.user.id,
      roomId: options.roomId,
      expression: options.expression,
      result: diceResult,
      timestamp: new Date().toISOString()
    });

    // Prepare roll data
    const rollData: RollInsert = {
      room_id: options.roomId,
      user_id: user.data.user.id,
      expression: options.expression,
      result: {
        ...diceResult,
        clientHash
      },
      total: diceResult.total,
      visibility: options.visibility || 'public',
      recipients: options.recipients || null,
      tag: diceResult.tag || null,
      tn: diceResult.target || null,
      request_id: options.requestId || null
    };

    const result = await safeQuery(() =>
      supabase.from('rolls').insert(rollData).select().single()
    );

    return { roll: result.data, error: result.error };
  }

  /**
   * Get rolls for a room with pagination
   */
  static async getRoomRolls(
    roomId: string, 
    limit: number = 50, 
    before?: string
  ): Promise<{ rolls: Roll[]; error: any }> {
    let query = supabase.from('rolls')
      .select(`
        *,
        players!inner(display_name, color_id, role)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const result = await safeQuery(() => query);
    
    return { 
      rolls: result.data || [], 
      error: result.error 
    };
  }

  /**
   * Create a roll request (GM feature)
   */
  static async createRollRequest(options: CreateRollRequestOptions): Promise<{ request: RollRequest | null; error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { request: null, error: new Error('User not authenticated') };
    }

    // Verify user is GM in the room
    const playerCheck = await safeQuery(() =>
      supabase.from('players')
        .select('role')
        .eq('room_id', options.roomId)
        .eq('user_id', user.data.user!.id)
        .single()
    );

    if (playerCheck.error || !playerCheck.data || playerCheck.data.role !== 'gm') {
      return { request: null, error: new Error('Only GMs can create roll requests') };
    }

    const requestData: RollRequestInsert = {
      room_id: options.roomId,
      gm_id: user.data.user.id,
      label: options.label,
      expression: options.expression,
      recipients: options.recipients || null,
      visibility: options.visibility || 'public'
    };

    const result = await safeQuery(() =>
      supabase.from('roll_requests').insert(requestData).select().single()
    );

    return { request: result.data, error: result.error };
  }

  /**
   * Get active roll requests for a room
   */
  static async getRollRequests(roomId: string): Promise<{ requests: RollRequest[]; error: any }> {
    const result = await safeQuery(() =>
      supabase.from('roll_requests')
        .select(`
          *,
          players!inner(display_name, color_id)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(20)
    );

    return { 
      requests: result.data || [], 
      error: result.error 
    };
  }

  /**
   * Respond to a roll request
   */
  static async respondToRollRequest(
    requestId: string,
    expression?: string,
    variables?: Record<string, number>
  ): Promise<{ roll: Roll | null; error: any }> {
    // Get the roll request
    const requestResult = await safeQuery(() =>
      supabase.from('roll_requests').select().eq('id', requestId).single()
    );

    if (requestResult.error || !requestResult.data) {
      return { roll: null, error: new Error('Roll request not found') };
    }

    const request = requestResult.data;
    
    // Use provided expression or default from request
    const rollExpression = expression || request.expression;

    // Create the roll response
    return this.createRoll({
      roomId: request.room_id,
      expression: rollExpression,
      variables,
      visibility: request.visibility,
      requestId: request.id
    });
  }

  /**
   * Subscribe to real-time roll updates for a room
   */
  static subscribeToRoomRolls(
    roomId: string,
    onRoll: (roll: Roll) => void,
    onError?: (error: any) => void
  ) {
    return supabase
      .channel(`room_rolls_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rolls',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onRoll(payload.new as Roll);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'roll_requests',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Handle new roll requests
          console.log('New roll request:', payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to room rolls');
        } else if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Failed to subscribe to room rolls'));
        }
      });
  }

  /**
   * Generate hash for audit trail
   */
  private static async generateRollHash(data: {
    userId: string;
    roomId: string;
    expression: string;
    result: DiceResult;
    timestamp: string;
  }): Promise<string> {
    const message = `${data.userId}:${data.roomId}:${data.expression}:${data.result.total}:${data.timestamp}`;
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Real-time subscription manager
export class RollSubscriptionManager {
  private subscriptions = new Map<string, any>();

  subscribe(roomId: string, onRoll: (roll: Roll) => void, onError?: (error: any) => void) {
    // Unsubscribe existing subscription for this room
    this.unsubscribe(roomId);

    const subscription = RollService.subscribeToRoomRolls(roomId, onRoll, onError);
    this.subscriptions.set(roomId, subscription);

    return subscription;
  }

  unsubscribe(roomId: string) {
    const subscription = this.subscriptions.get(roomId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(roomId);
    }
  }

  unsubscribeAll() {
    for (const [roomId] of this.subscriptions) {
      this.unsubscribe(roomId);
    }
  }
}
