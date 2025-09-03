import { supabase, isSupabaseConfigured } from '../supabase';

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

// Simplified room service without complex typing
export class RoomService {
  
  /**
   * Create a new room with the current user as GM
   */
  static async createRoom(options: CreateRoomOptions) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - using mock data');
      return { 
        room: { id: 'mock-room', name: options.name, join_code: 'DEMO123' }, 
        player: { id: 'mock-player', display_name: options.playerName, role: 'gm' },
        error: null 
      };
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return { room: null, player: null, error: new Error('User not authenticated') };
      }

      // Generate unique join code
      const joinCode = this.generateJoinCode();
      
      const roomData = {
        name: options.name || 'New Room',
        system_preset: options.systemPreset || 'generic',
        join_code: joinCode,
        created_by: user.data.user.id
      };

      // Create room
      const roomResult = await supabase.from('rooms').insert(roomData).select().single();

      if (roomResult.error || !roomResult.data) {
        return { room: null, player: null, error: roomResult.error };
      }

      const room = roomResult.data;

      // Add creator as GM player
      const colorId = options.colorId ?? 0;
      const playerData = {
        room_id: room.id,
        user_id: user.data.user.id,
        display_name: options.playerName,
        color_id: colorId,
        role: 'gm'
      };

      const playerResult = await supabase.from('players').insert(playerData).select().single();

      if (playerResult.error) {
        // Try to clean up room if player creation failed
        await supabase.from('rooms').delete().eq('id', room.id);
        return { room: null, player: null, error: playerResult.error };
      }

      return { room, player: playerResult.data, error: null };

    } catch (error) {
      return { room: null, player: null, error };
    }
  }

  /**
   * Join an existing room
   */
  static async joinRoom(options: JoinRoomOptions) {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - using mock data');
      return { 
        room: { id: 'mock-room', name: 'Demo Room', join_code: options.joinCode }, 
        player: { id: 'mock-player', display_name: options.playerName, role: 'player' },
        error: null 
      };
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return { room: null, player: null, error: new Error('User not authenticated') };
      }

      // Find room by join code
      const roomResult = await supabase.from('rooms')
        .select()
        .eq('join_code', options.joinCode.toUpperCase())
        .single();

      if (roomResult.error || !roomResult.data) {
        return { room: null, player: null, error: new Error('Room not found') };
      }

      const room = roomResult.data;

      // Check if user is already in room
      const existingPlayerResult = await supabase.from('players')
        .select()
        .eq('room_id', room.id)
        .eq('user_id', user.data.user.id)
        .single();

      if (existingPlayerResult.data) {
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
      const playerData = {
        room_id: room.id,
        user_id: user.data.user.id,
        display_name: options.playerName,
        color_id: colorId,
        role: 'player'
      };

      const playerResult = await supabase.from('players').insert(playerData).select().single();

      if (playerResult.error) {
        if (playerResult.error.code === '23505') {
          return { room: null, player: null, error: new Error('Color already taken') };
        }
        return { room: null, player: null, error: playerResult.error };
      }

      return { room, player: playerResult.data, error: null };

    } catch (error) {
      return { room: null, player: null, error };
    }
  }

  /**
   * Get room details with players
   */
  static async getRoomWithPlayers(roomId: string) {
    if (!isSupabaseConfigured()) {
      return { 
        room: { id: roomId, name: 'Demo Room', join_code: 'DEMO123' }, 
        players: [{ display_name: 'Demo Player', color_id: 0, role: 'gm' }], 
        error: null 
      };
    }

    try {
      const roomResult = await supabase.from('rooms').select().eq('id', roomId).single();
      if (roomResult.error || !roomResult.data) {
        return { room: null, players: [], error: roomResult.error };
      }

      const playersResult = await supabase.from('players')
        .select()
        .eq('room_id', roomId)
        .order('created_at');

      return {
        room: roomResult.data,
        players: playersResult.data || [],
        error: playersResult.error
      };

    } catch (error) {
      return { room: null, players: [], error };
    }
  }

  /**
   * Suggest a free color for a room
   */
  static async suggestFreeColor(roomId: string, maxColors: number = 32): Promise<number | null> {
    if (!isSupabaseConfigured()) {
      return 0; // Default color for demo
    }

    try {
      // Get taken colors
      const result = await supabase.from('players')
        .select('color_id')
        .eq('room_id', roomId);

      if (result.error || !result.data) {
        return 0;
      }

      const takenColors = new Set(result.data.map(p => p.color_id));
      
      // Find first free color
      for (let i = 0; i < maxColors; i++) {
        if (!takenColors.has(i)) {
          return i;
        }
      }

      return null; // All colors taken

    } catch (error) {
      console.error('Error suggesting color:', error);
      return 0;
    }
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
