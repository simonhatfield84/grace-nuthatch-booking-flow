
-- Configure tables 1,2,3,4 as a join group for parties of 7+ people
UPDATE tables SET join_groups = ARRAY[1] WHERE label IN ('1', '2', '3', '4');

-- Add a join groups configuration table to manage table groupings
CREATE TABLE IF NOT EXISTS public.join_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  table_ids INTEGER[] NOT NULL,
  min_party_size INTEGER NOT NULL DEFAULT 1,
  max_party_size INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the join group for tables 1-4
INSERT INTO public.join_groups (name, description, table_ids, min_party_size, max_party_size)
VALUES ('Main Dining Group', 'Tables 1-4 combined for larger parties', ARRAY[1,2,3,4], 7, 20)
ON CONFLICT DO NOTHING;

-- Enable RLS for join_groups table
ALTER TABLE public.join_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for join_groups
CREATE POLICY "Allow all users to view join_groups" ON public.join_groups FOR SELECT USING (true);
CREATE POLICY "Allow all users to create join_groups" ON public.join_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update join_groups" ON public.join_groups FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete join_groups" ON public.join_groups FOR DELETE USING (true);
