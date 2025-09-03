-- DiceRoom Database Schema for Supabase
-- Based on comprehensive project specification

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  system_preset text,              -- e.g. "daggerheart", "dnd5e", "generic"
  join_code text UNIQUE NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE public.players (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  color_id smallint NOT NULL,
  role text CHECK (role IN ('gm', 'player')) NOT NULL DEFAULT 'player',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Ensure unique colors per room
CREATE UNIQUE INDEX players_room_color_unique ON public.players(room_id, color_id);

-- Variables table (user and room-wide variables)
CREATE TABLE public.variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  owner_user_id uuid,              -- NULL = room-wide variable
  key text NOT NULL,
  value jsonb NOT NULL,
  visibility text CHECK (visibility IN ('public','gm','private')) NOT NULL DEFAULT 'public',
  updated_at timestamptz DEFAULT now()
);

-- Macros table (named shortcuts)
CREATE TABLE public.macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  owner_user_id uuid,              -- NULL = room-wide (GM macros)
  name text NOT NULL,
  expression text NOT NULL,
  sort_index int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Rolls table (all dice roll results)
CREATE TABLE public.rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  expression text NOT NULL,
  result jsonb NOT NULL,           -- detailed breakdown with individual dice
  total numeric NOT NULL,
  visibility text CHECK (visibility IN ('public','gm','whisper')) DEFAULT 'public',
  recipients uuid[],               -- for whisper rolls
  tag text,                        -- e.g. "Hope", "Fear", "Critical"
  tn jsonb,                        -- target number: {op:'>=', value:15, pass:true}
  server_proof text,               -- optional: hash proof for server rolls
  request_id uuid,                 -- reference to roll_requests if this is a response
  created_at timestamptz DEFAULT now()
);

-- Roll requests table (GM can request rolls from players)
CREATE TABLE public.roll_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  gm_id uuid NOT NULL,
  label text NOT NULL,             -- "Perception Check"
  expression text NOT NULL,        -- e.g. "1d20+@WIS+@PROF"
  recipients uuid[],               -- NULL = all players
  visibility text CHECK (visibility IN ('public','gm')) NOT NULL DEFAULT 'public',
  created_at timestamptz DEFAULT now()
);

-- Variable templates table (for system presets and onboarding)
CREATE TABLE public.variable_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  default_value jsonb,
  required boolean DEFAULT false,
  scope text CHECK (scope IN ('user','room')) NOT NULL
);

-- Add foreign key for roll requests
ALTER TABLE public.rolls ADD CONSTRAINT rolls_request_id_fkey 
  FOREIGN KEY (request_id) REFERENCES public.roll_requests(id);

-- Indexes for performance
CREATE INDEX idx_players_room_id ON public.players(room_id);
CREATE INDEX idx_variables_room_id ON public.variables(room_id);
CREATE INDEX idx_variables_owner ON public.variables(owner_user_id);
CREATE INDEX idx_macros_room_id ON public.macros(room_id);
CREATE INDEX idx_macros_owner ON public.macros(owner_user_id);
CREATE INDEX idx_rolls_room_id ON public.rolls(room_id);
CREATE INDEX idx_rolls_user_id ON public.rolls(user_id);
CREATE INDEX idx_rolls_created_at ON public.rolls(created_at DESC);
CREATE INDEX idx_roll_requests_room_id ON public.roll_requests(room_id);
CREATE INDEX idx_variable_templates_room_id ON public.variable_templates(room_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roll_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Rooms: Anyone can read, only creators can update
CREATE POLICY "Anyone can read rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can insert rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their rooms" ON public.rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- Players: Room members can read, users can manage their own profile
CREATE POLICY "Room members can read players" ON public.players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p2 
      WHERE p2.room_id = players.room_id 
      AND p2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own player profile" ON public.players
  FOR ALL USING (auth.uid() = user_id);

-- Variables: Visibility-based access
CREATE POLICY "Users can read public variables" ON public.variables
  FOR SELECT USING (
    visibility = 'public' AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = variables.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own variables" ON public.variables
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "GMs can read all variables in their rooms" ON public.variables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = variables.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

CREATE POLICY "Users can manage their own variables" ON public.variables
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "GMs can manage room variables" ON public.variables
  FOR ALL USING (
    owner_user_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = variables.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

-- Macros: Similar to variables
CREATE POLICY "Room members can read macros" ON public.macros
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = macros.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own macros" ON public.macros
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "GMs can manage room macros" ON public.macros
  FOR ALL USING (
    owner_user_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = macros.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

-- Rolls: Visibility-based access
CREATE POLICY "Users can read public rolls" ON public.rolls
  FOR SELECT USING (
    visibility = 'public' AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = rolls.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own rolls" ON public.rolls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "GMs can read GM-only rolls" ON public.rolls
  FOR SELECT USING (
    visibility = 'gm' AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = rolls.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

CREATE POLICY "Recipients can read whisper rolls" ON public.rolls
  FOR SELECT USING (
    visibility = 'whisper' AND
    (auth.uid() = user_id OR auth.uid() = ANY(recipients))
  );

CREATE POLICY "Room members can create rolls" ON public.rolls
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = rolls.room_id 
      AND p.user_id = auth.uid()
    )
  );

-- Roll requests: GMs can create, relevant players can read
CREATE POLICY "GMs can manage roll requests" ON public.roll_requests
  FOR ALL USING (
    auth.uid() = gm_id AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = roll_requests.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

CREATE POLICY "Players can read relevant roll requests" ON public.roll_requests
  FOR SELECT USING (
    (recipients IS NULL OR auth.uid() = ANY(recipients)) AND
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = roll_requests.room_id 
      AND p.user_id = auth.uid()
    )
  );

-- Variable templates: Room-based access
CREATE POLICY "Room members can read variable templates" ON public.variable_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = variable_templates.room_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "GMs can manage variable templates" ON public.variable_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.room_id = variable_templates.room_id 
      AND p.user_id = auth.uid() 
      AND p.role = 'gm'
    )
  );

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT COUNT(*) > 0 INTO exists FROM public.rooms WHERE join_code = code;
    
    -- If unique, return the code
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest free color for a room
CREATE OR REPLACE FUNCTION suggest_free_color(room_uuid uuid, max_colors int DEFAULT 32)
RETURNS int AS $$
DECLARE
  color_id int;
  taken_colors int[];
BEGIN
  -- Get all taken colors in the room
  SELECT array_agg(color_id) INTO taken_colors 
  FROM public.players 
  WHERE room_id = room_uuid;
  
  -- If no colors taken, return 0
  IF taken_colors IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Find first free color
  FOR color_id IN 0..max_colors-1 LOOP
    IF NOT (color_id = ANY(taken_colors)) THEN
      RETURN color_id;
    END IF;
  END LOOP;
  
  -- All colors taken
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
