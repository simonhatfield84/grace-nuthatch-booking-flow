-- Create trigger to auto-assign tags after guest metrics update
CREATE OR REPLACE FUNCTION public.trigger_auto_tag_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Call assign_automatic_tags for the updated guest
  PERFORM public.assign_automatic_tags(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on guests table
DROP TRIGGER IF EXISTS after_guest_metrics_update ON public.guests;
CREATE TRIGGER after_guest_metrics_update
  AFTER UPDATE OF actual_visit_count, total_spend_cents, 
                 average_spend_per_visit_cents, average_spend_per_cover_cents,
                 last_actual_visit_date
  ON public.guests
  FOR EACH ROW
  WHEN (
    OLD.actual_visit_count IS DISTINCT FROM NEW.actual_visit_count OR
    OLD.total_spend_cents IS DISTINCT FROM NEW.total_spend_cents OR
    OLD.average_spend_per_visit_cents IS DISTINCT FROM NEW.average_spend_per_visit_cents OR
    OLD.average_spend_per_cover_cents IS DISTINCT FROM NEW.average_spend_per_cover_cents OR
    OLD.last_actual_visit_date IS DISTINCT FROM NEW.last_actual_visit_date
  )
  EXECUTE FUNCTION public.trigger_auto_tag_assignment();

-- Bulk assign tags to all existing guests
DO $$
DECLARE
  guest_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  FOR guest_record IN SELECT id FROM public.guests LOOP
    PERFORM public.assign_automatic_tags(guest_record.id);
    processed_count := processed_count + 1;
  END LOOP;
  RAISE NOTICE 'Auto-assigned tags to % guests', processed_count;
END $$;