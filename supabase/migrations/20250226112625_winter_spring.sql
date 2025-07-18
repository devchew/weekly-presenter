/*
  # Add insert policies for teams and team members
  
  1. Changes
    - Add RLS policies to allow public insert access to teams and team members
  
  2. Security
    - Allow public insert access to teams table
    - Allow public insert access to team_members table
*/

CREATE POLICY "Allow public insert access to teams"
  ON teams
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to team members"
  ON team_members
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to teams"
  ON teams
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public update access to team members"
  ON team_members
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to teams"
  ON teams
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to team members"
  ON team_members
  FOR DELETE
  TO public
  USING (true);