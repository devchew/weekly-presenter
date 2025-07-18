/*
  # Create teams and team members tables

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `presentation_day` (integer, 0-6 representing day of week)
      - `created_at` (timestamp)
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `name` (text)
      - `position` (integer, for ordering)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access to both tables
*/

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_day integer NOT NULL CHECK (presentation_day >= 0 AND presentation_day <= 6),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX team_members_team_id_idx ON team_members(team_id);
CREATE INDEX team_members_position_idx ON team_members(team_id, position);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to teams"
  ON teams
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to team members"
  ON team_members
  FOR SELECT
  TO public
  USING (true);