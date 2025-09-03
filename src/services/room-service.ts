import { supabase, safeQuery } from '../supabase';
import type { Room, RoomInsert, Player, PlayerInsert } from '../types/database';

export interface CreateRoomOptions {
  name?: string;
  systemPreset?: string;
  playerName: string;
  colorId?: number;
}

export interface JoinRoomOptions {
  joinCode: string;
  playerName: string;
  colorId?: number;
}

// Room management functions
export class RoomService {
  
  /**
   * Create a new room with the current user as GM
   */
  static async createRoom(options: CreateRoomOptions): Promise<{ room: Room | null; player: Player | null; error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { room: null, player: null, error: new Error('User not authenticated') };
    }

    // Generate unique join code
    const joinCode = this.generateJoinCode();
    
    const roomData: RoomInsert = {
      name: options.name || 'New Room',
      system_preset: options.systemPreset || 'generic',
      join_code: joinCode,
      created_by: user.data.user.id
    };

    // Create room
    const roomResult = await safeQuery(() => 
      supabase.from('rooms').insert(roomData).select().single()
    );

    if (roomResult.error || !roomResult.data) {
      return { room: null, player: null, error: roomResult.error };
    }

    const room = roomResult.data;

    // Add creator as GM player
    const colorId = options.colorId ?? 0; // GM gets first color
    const playerData: PlayerInsert = {
      room_id: room.id,
      user_id: user.data.user.id,
      display_name: options.playerName,
      color_id: colorId,
      role: 'gm'
    };

    const playerResult = await safeQuery(() =>
      supabase.from('players').insert(playerData).select().single()
    );

    if (playerResult.error) {
      // Try to clean up room if player creation failed
      await supabase.from('rooms').delete().eq('id', room.id);
      return { room: null, player: null, error: playerResult.error };
    }

    return { room, player: playerResult.data, error: null };
  }

  /**
   * Join an existing room
   */
  static async joinRoom(options: JoinRoomOptions): Promise<{ room: Room | null; player: Player | null; error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { room: null, player: null, error: new Error('User not authenticated') };
    }

    // Find room by join code
    const roomResult = await safeQuery(() =>
      supabase.from('rooms').select().eq('join_code', options.joinCode.toUpperCase()).single()
    );

    if (roomResult.error || !roomResult.data) {
      return { room: null, player: null, error: new Error('Room not found') };
    }

    const room = roomResult.data;

    // Check if user is already in room
    const existingPlayerResult = await safeQuery(() =>
      supabase.from('players')
        .select()
        .eq('room_id', room.id)
        .eq('user_id', user.data.user!.id)
        .single()
    );

    if (existingPlayerResult.data) {
      // User already in room, return existing player
      return { room, player: existingPlayerResult.data, error: null };
    }

    // Get suggested color if none provided
    let colorId = options.colorId;
    if (colorId === undefined) {
      colorId = await this.suggestFreeColor(room.id);
      if (colorId === null) {
        return { room: null, player: null, error: new Error('No free colors available') };
      }
    }

    // Add user as player
    const playerData: PlayerInsert = {
      room_id: room.id,
      user_id: user.data.user.id,
      display_name: options.playerName,
      color_id: colorId,
      role: 'player'
    };

    const playerResult = await safeQuery(() =>
      supabase.from('players').insert(playerData).select().single()
    );

    if (playerResult.error) {
      // Check if it's a color conflict
      if (playerResult.error.code === '23505') { // unique constraint violation
        return { room: null, player: null, error: new Error('Color already taken') };
      }
      return { room: null, player: null, error: playerResult.error };
    }

    return { room, player: playerResult.data, error: null };
  }

  /**
   * Get room details with players
   */
  static async getRoomWithPlayers(roomId: string): Promise<{ room: Room | null; players: Player[]; error: any }> {
    const roomResult = await safeQuery(() =>
      supabase.from('rooms').select().eq('id', roomId).single()
    );

    if (roomResult.error || !roomResult.data) {
      return { room: null, players: [], error: roomResult.error };
    }

    const playersResult = await safeQuery(() =>
      supabase.from('players').select().eq('room_id', roomId).order('created_at')
    );

    return {
      room: roomResult.data,
      players: playersResult.data || [],
      error: playersResult.error
    };
  }

  /**
   * Leave a room (remove player)
   */
  static async leaveRoom(roomId: string): Promise<{ error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { error: new Error('User not authenticated') };
    }

    const result = await safeQuery(() =>
      supabase.from('players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.data.user!.id)
    );

    return { error: result.error };
  }

  /**
   * Update player profile in room
   */
  static async updatePlayer(roomId: string, updates: Partial<PlayerInsert>): Promise<{ player: Player | null; error: any }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { player: null, error: new Error('User not authenticated') };
    }

    const result = await safeQuery(() =>
      supabase.from('players')
        .update(updates)
        .eq('room_id', roomId)
        .eq('user_id', user.data.user!.id)
        .select()
        .single()
    );

    return { player: result.data, error: result.error };
  }

  /**
   * Suggest a free color for a room
   */
  static async suggestFreeColor(roomId: string, maxColors: number = 32): Promise<number | null> {
    const result = await safeQuery(() =>
      supabase.rpc('suggest_free_color', { room_uuid: roomId, max_colors: maxColors })
    );

    return result.data;
  }

  /**
   * Generate a random join code
   */
  private static generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Color palette for player colors
export const COLOR_PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94',
  '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5', '#3a86ff', '#7b2cbf', '#1b998b', '#f72585',
  '#4cc9f0', '#480ca8', '#560bad', '#b5179e', '#f72585', '#fcf300', '#ffbe0b', '#fb8500'
];

export function getColorById(colorId: number): string {
  return COLOR_PALETTE[colorId % COLOR_PALETTE.length] || COLOR_PALETTE[0];
}
