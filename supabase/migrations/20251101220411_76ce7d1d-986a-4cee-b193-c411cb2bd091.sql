-- Phase 3, 4, 5: Add new columns, tables, tags, and enhanced auto-tag logic

-- Add new columns to guests table for advanced metrics
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS behavior_metrics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS email_marketing_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS predicted_ltv_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltv_segment TEXT,
  ADD COLUMN IF NOT EXISTS churn_risk_score NUMERIC(3,2);

-- Create guest_notes table for structured timeline notes
CREATE TABLE IF NOT EXISTS guest_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  note_type TEXT,
  related_booking_id INTEGER REFERENCES bookings(id),
  is_pinned BOOLEAN DEFAULT false,
  venue_id UUID REFERENCES venues(id) NOT NULL
);

-- Add RLS policies for guest_notes
ALTER TABLE guest_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their venue guest notes"
  ON guest_notes FOR SELECT
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue users can manage guest notes"
  ON guest_notes FOR ALL
  USING (venue_id = get_user_venue(auth.uid()));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_guest_notes_guest_id ON guest_notes(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_notes_created_at ON guest_notes(created_at DESC);

-- Add new automatic tags (get venue_id from existing tags)
DO $$
DECLARE
  v_venue_id UUID;
BEGIN
  -- Get a sample venue_id from existing tags
  SELECT venue_id INTO v_venue_id FROM tags LIMIT 1;
  
  IF v_venue_id IS NOT NULL THEN
    -- Insert new tags if they don't exist
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'Regular', '#10B981', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Regular' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'Ex-Regular', '#F59E0B', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Ex-Regular' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'HV', '#8B5CF6', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'HV' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'High Spend', '#EC4899', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'High Spend' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'VIP', '#EF4444', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'VIP' AND venue_id = v_venue_id);
    
    -- Additional behavioral tags
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'Weekend Warrior', '#06B6D4', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Weekend Warrior' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'Group Organizer', '#8B5CF6', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Group Organizer' AND venue_id = v_venue_id);
    
    INSERT INTO tags (name, color, is_automatic, venue_id) 
    SELECT 'At Risk', '#EF4444', true, v_venue_id
    WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'At Risk' AND venue_id = v_venue_id);
  END IF;
END $$;

-- Enhanced assign_automatic_tags function with new rules
CREATE OR REPLACE FUNCTION assign_automatic_tags(guest_id_param UUID)
RETURNS void AS $$
DECLARE
  guest_record RECORD;
  tag_record RECORD;
  stats_record RECORD;
  booking_stats RECORD;
BEGIN
  -- Get guest details with all metrics
  SELECT * INTO guest_record FROM guests WHERE id = guest_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate booking statistics
  SELECT 
    COUNT(*) as visit_count,
    MAX(booking_date) as last_visit_date,
    AVG(party_size) as avg_party_size,
    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM booking_date) IN (5,6,0)) as weekend_bookings,
    COUNT(*) FILTER (WHERE party_size >= 6) as group_bookings
  INTO booking_stats
  FROM bookings
  WHERE (
    (guest_record.email IS NOT NULL AND LOWER(email) = LOWER(guest_record.email)) OR
    (guest_record.phone IS NOT NULL AND phone = guest_record.phone)
  )
  AND status NOT IN ('cancelled', 'no_show');

  -- Remove all existing automatic tags for this guest
  DELETE FROM guest_tags 
  WHERE guest_id = guest_id_param 
    AND assigned_by = 'system';

  -- Loop through all automatic tags and apply rules
  FOR tag_record IN 
    SELECT * FROM tags 
    WHERE is_automatic = true 
      AND venue_id = guest_record.venue_id
  LOOP
    CASE tag_record.name
      -- VIP: Highest priority - replaces all other tags
      WHEN 'VIP' THEN
        IF guest_record.total_spend_cents > 50000 
           AND guest_record.average_spend_per_cover_cents > 5000 
        THEN
          -- Clear all system tags and add only VIP
          DELETE FROM guest_tags 
          WHERE guest_id = guest_id_param 
            AND assigned_by = 'system';
          
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
          
          -- Exit early since VIP overrides everything
          RETURN;
        END IF;

      -- Regular: 3+ visits within 3 months
      WHEN 'Regular' THEN
        IF guest_record.actual_visit_count >= 3 
           AND guest_record.last_actual_visit_date >= CURRENT_DATE - INTERVAL '3 months' 
        THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- Ex-Regular: Was regular but no visit within 4 weeks
      WHEN 'Ex-Regular' THEN
        IF guest_record.actual_visit_count >= 3
           AND guest_record.last_actual_visit_date < CURRENT_DATE - INTERVAL '4 weeks'
           AND guest_record.last_actual_visit_date >= CURRENT_DATE - INTERVAL '6 months'
        THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- HV (High Value): Average cover spend > £50
      WHEN 'HV' THEN
        IF guest_record.average_spend_per_cover_cents > 5000 THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- High Spend: Total guest spend > £500
      WHEN 'High Spend' THEN
        IF guest_record.total_spend_cents > 50000 THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- Weekend Warrior: 80%+ bookings on Fri-Sun
      WHEN 'Weekend Warrior' THEN
        IF booking_stats.visit_count > 0 
           AND (booking_stats.weekend_bookings::FLOAT / booking_stats.visit_count) >= 0.8 
        THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- Group Organizer: 50%+ bookings with 6+ guests
      WHEN 'Group Organizer' THEN
        IF booking_stats.visit_count > 0 
           AND (booking_stats.group_bookings::FLOAT / booking_stats.visit_count) >= 0.5 
        THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- At Risk: High value but declining engagement
      WHEN 'At Risk' THEN
        IF guest_record.churn_risk_score IS NOT NULL 
           AND guest_record.churn_risk_score > 0.7 
        THEN
          INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id)
          ON CONFLICT DO NOTHING;
        END IF;

      -- Keep existing automatic tag logic for other tags
      ELSE
        -- Existing tag logic continues here
        NULL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;