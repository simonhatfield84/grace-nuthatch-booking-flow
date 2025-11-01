-- Create function to calculate churn risk score (0.00 to 1.00)
CREATE OR REPLACE FUNCTION public.calculate_churn_risk(guest_id_param UUID)
RETURNS NUMERIC(3,2) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  guest_record RECORD;
  days_since_last_visit INTEGER;
  avg_days_between_visits NUMERIC;
  recent_visit_count INTEGER;
  previous_visit_count INTEGER;
  recent_avg_spend NUMERIC;
  historical_avg_spend NUMERIC;
  factor1_score NUMERIC := 0.5;
  factor2_score NUMERIC := 0.5;
  factor3_score NUMERIC := 0.5;
  factor4_score NUMERIC := 0.5;
  days_overdue NUMERIC;
  trend_ratio NUMERIC;
  spend_ratio NUMERIC;
BEGIN
  -- Get guest data
  SELECT * INTO guest_record FROM guests WHERE id = guest_id_param;
  
  IF NOT FOUND OR guest_record.actual_visit_count IS NULL OR guest_record.actual_visit_count = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate days since last visit
  days_since_last_visit := CURRENT_DATE - guest_record.last_actual_visit_date;
  
  -- FACTOR 1: Days Since Last Visit (40% weight)
  IF guest_record.actual_visit_count = 1 THEN
    -- Single visit guest
    IF days_since_last_visit <= 60 THEN
      factor1_score := 0.2;
    ELSE
      factor1_score := 0.5;
    END IF;
  ELSE
    -- Calculate average days between visits
    SELECT 
      NULLIF(EXTRACT(EPOCH FROM (MAX(booking_date) - MIN(booking_date)))::INTEGER / 86400, 0) / 
      NULLIF(COUNT(*) - 1, 0)
    INTO avg_days_between_visits
    FROM bookings
    WHERE (
      (guest_record.email IS NOT NULL AND LOWER(email) = LOWER(guest_record.email)) OR
      (guest_record.phone IS NOT NULL AND phone = guest_record.phone)
    )
    AND status IN ('finished', 'seated', 'confirmed');
    
    IF avg_days_between_visits IS NOT NULL AND avg_days_between_visits > 0 THEN
      days_overdue := (days_since_last_visit - avg_days_between_visits) / avg_days_between_visits;
      
      IF days_overdue < 0 THEN
        factor1_score := 0.0;
      ELSIF days_overdue < 0.5 THEN
        factor1_score := 0.2;
      ELSIF days_overdue < 1.0 THEN
        factor1_score := 0.5;
      ELSIF days_overdue < 2.0 THEN
        factor1_score := 0.8;
      ELSE
        factor1_score := 1.0;
      END IF;
    ELSE
      factor1_score := 0.5;
    END IF;
  END IF;
  
  -- FACTOR 2: Visit Frequency Trend (30% weight)
  -- Recent 90 days vs previous 90 days (91-180 days ago)
  SELECT 
    COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE - INTERVAL '90 days'),
    COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE - INTERVAL '180 days' 
                          AND booking_date < CURRENT_DATE - INTERVAL '90 days')
  INTO recent_visit_count, previous_visit_count
  FROM bookings
  WHERE (
    (guest_record.email IS NOT NULL AND LOWER(email) = LOWER(guest_record.email)) OR
    (guest_record.phone IS NOT NULL AND phone = guest_record.phone)
  )
  AND status IN ('finished', 'seated', 'confirmed');
  
  IF previous_visit_count > 0 THEN
    trend_ratio := recent_visit_count::NUMERIC / previous_visit_count;
    
    IF trend_ratio >= 1.5 THEN
      factor2_score := 0.0;
    ELSIF trend_ratio >= 1.0 THEN
      factor2_score := 0.2;
    ELSIF trend_ratio >= 0.5 THEN
      factor2_score := 0.5;
    ELSIF trend_ratio >= 0.1 THEN
      factor2_score := 0.8;
    ELSE
      factor2_score := 1.0;
    END IF;
  ELSIF recent_visit_count = 0 THEN
    factor2_score := 1.0;
  ELSE
    factor2_score := 0.5;
  END IF;
  
  -- FACTOR 3: Spending Trend (20% weight)
  -- Compare last 3 visits to all-time average
  SELECT AVG(so.total_money) INTO recent_avg_spend
  FROM (
    SELECT b.id, b.booking_date
    FROM bookings b
    WHERE (
      (guest_record.email IS NOT NULL AND LOWER(b.email) = LOWER(guest_record.email)) OR
      (guest_record.phone IS NOT NULL AND b.phone = guest_record.phone)
    )
    AND b.status IN ('finished', 'seated')
    ORDER BY b.booking_date DESC
    LIMIT 3
  ) recent_bookings
  LEFT JOIN order_links ol ON ol.visit_id = recent_bookings.id
  LEFT JOIN square_orders so ON ol.order_id = so.order_id AND so.state = 'COMPLETED';
  
  historical_avg_spend := guest_record.average_spend_per_visit_cents;
  
  IF historical_avg_spend IS NOT NULL AND historical_avg_spend > 0 AND recent_avg_spend IS NOT NULL THEN
    spend_ratio := recent_avg_spend / historical_avg_spend;
    
    IF spend_ratio >= 1.2 THEN
      factor3_score := 0.0;
    ELSIF spend_ratio >= 0.8 THEN
      factor3_score := 0.2;
    ELSIF spend_ratio >= 0.5 THEN
      factor3_score := 0.5;
    ELSIF recent_avg_spend > 0 THEN
      factor3_score := 0.8;
    ELSE
      factor3_score := 1.0;
    END IF;
  ELSIF historical_avg_spend > 0 AND (recent_avg_spend IS NULL OR recent_avg_spend = 0) THEN
    factor3_score := 1.0;
  ELSE
    factor3_score := 0.5;
  END IF;
  
  -- FACTOR 4: Email Engagement (10% weight) - Future enhancement
  factor4_score := 0.5;
  
  -- Calculate weighted final score
  RETURN ROUND(
    (factor1_score * 0.4) + 
    (factor2_score * 0.3) + 
    (factor3_score * 0.2) + 
    (factor4_score * 0.1),
    2
  );
END;
$$;

-- Create function to update churn risk and assign "At Risk" tag
CREATE OR REPLACE FUNCTION public.update_churn_risk(guest_id_param UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_score NUMERIC(3,2);
  guest_venue_id UUID;
  at_risk_tag_id UUID;
BEGIN
  -- Calculate new churn risk score
  new_score := calculate_churn_risk(guest_id_param);
  
  -- Update guest record
  UPDATE guests 
  SET churn_risk_score = new_score,
      updated_at = NOW()
  WHERE id = guest_id_param
  RETURNING venue_id INTO guest_venue_id;
  
  -- Find "At Risk" tag for this venue
  SELECT id INTO at_risk_tag_id
  FROM tags 
  WHERE name = 'At Risk' 
    AND venue_id = guest_venue_id
    AND is_automatic = true;
  
  IF at_risk_tag_id IS NOT NULL THEN
    -- Assign "At Risk" tag if score > 0.7
    IF new_score IS NOT NULL AND new_score > 0.7 THEN
      INSERT INTO guest_tags (guest_id, tag_id, assigned_by, venue_id)
      VALUES (guest_id_param, at_risk_tag_id, 'system', guest_venue_id)
      ON CONFLICT (guest_id, tag_id) DO NOTHING;
    ELSE
      -- Remove "At Risk" tag if score <= 0.7
      DELETE FROM guest_tags
      WHERE guest_id = guest_id_param
        AND tag_id = at_risk_tag_id;
    END IF;
  END IF;
END;
$$;

-- Create function to calculate predicted LTV
CREATE OR REPLACE FUNCTION public.calculate_ltv(guest_id_param UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  guest_record RECORD;
  visit_frequency NUMERIC;
  projected_annual_visits NUMERIC;
  retention_multiplier NUMERIC;
  predicted_ltv INTEGER;
  days_span INTEGER;
BEGIN
  SELECT * INTO guest_record FROM guests WHERE id = guest_id_param;
  
  IF NOT FOUND OR guest_record.actual_visit_count IS NULL OR guest_record.actual_visit_count = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate visit frequency (visits per month)
  SELECT 
    EXTRACT(EPOCH FROM (MAX(booking_date::timestamp) - MIN(booking_date::timestamp)))::INTEGER / 86400
  INTO days_span
  FROM bookings
  WHERE (
    (guest_record.email IS NOT NULL AND LOWER(email) = LOWER(guest_record.email)) OR
    (guest_record.phone IS NOT NULL AND phone = guest_record.phone)
  )
  AND status IN ('finished', 'seated', 'confirmed');
  
  -- Calculate visits per month
  IF days_span > 0 AND guest_record.actual_visit_count > 1 THEN
    visit_frequency := (guest_record.actual_visit_count * 30.0) / days_span;
  ELSE
    -- Default to 1 visit per month for single-visit guests
    visit_frequency := 1.0;
  END IF;
  
  -- Cap at reasonable max (2 visits per month)
  visit_frequency := LEAST(visit_frequency, 2.0);
  
  -- Project annual visits
  projected_annual_visits := visit_frequency * 12;
  
  -- Calculate retention multiplier based on churn risk
  retention_multiplier := 1.0 - (COALESCE(guest_record.churn_risk_score, 0.5) * 0.5);
  
  -- Calculate LTV (ensure we have spend data)
  IF guest_record.average_spend_per_visit_cents IS NOT NULL AND guest_record.average_spend_per_visit_cents > 0 THEN
    predicted_ltv := (
      guest_record.average_spend_per_visit_cents * 
      projected_annual_visits * 
      retention_multiplier
    )::INTEGER;
  ELSE
    predicted_ltv := 0;
  END IF;
  
  RETURN predicted_ltv;
END;
$$;

-- Create function to update LTV and segment
CREATE OR REPLACE FUNCTION public.update_ltv(guest_id_param UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_ltv INTEGER;
  new_segment TEXT;
BEGIN
  new_ltv := calculate_ltv(guest_id_param);
  
  -- Determine segment (amounts in pence)
  IF new_ltv >= 100000 THEN
    new_segment := 'platinum';
  ELSIF new_ltv >= 50100 THEN
    new_segment := 'gold';
  ELSIF new_ltv >= 25100 THEN
    new_segment := 'silver';
  ELSE
    new_segment := 'bronze';
  END IF;
  
  -- Update guest
  UPDATE guests
  SET 
    predicted_ltv_cents = new_ltv,
    ltv_segment = new_segment,
    updated_at = NOW()
  WHERE id = guest_id_param;
END;
$$;

-- Update trigger to include churn risk and LTV calculation
CREATE OR REPLACE FUNCTION public.trigger_auto_tag_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call assign_automatic_tags for the updated guest
  PERFORM assign_automatic_tags(NEW.id);
  
  -- Update churn risk score and "At Risk" tag
  PERFORM update_churn_risk(NEW.id);
  
  -- Update LTV and segment
  PERFORM update_ltv(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Bulk calculate churn risk and LTV for all existing guests with visit history
DO $$
DECLARE
  guest_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  FOR guest_record IN 
    SELECT id FROM guests 
    WHERE actual_visit_count > 0
    ORDER BY actual_visit_count DESC
  LOOP
    BEGIN
      PERFORM update_churn_risk(guest_record.id);
      PERFORM update_ltv(guest_record.id);
      processed_count := processed_count + 1;
      
      -- Log progress every 50 guests
      IF processed_count % 50 = 0 THEN
        RAISE NOTICE 'Processed % guests', processed_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to process guest %: %', guest_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Bulk calculation complete. Processed % guests total.', processed_count;
END $$;