
-- Security hardening: Update database functions with proper search_path settings
-- This prevents potential SQL injection through search_path manipulation

-- 1. Update update_user_role function with secure search_path
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role app_role, target_venue_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  caller_is_admin BOOLEAN;
  caller_current_role public.app_role;
  target_current_role public.app_role;
  caller_user_id UUID;
  owner_count INTEGER;
BEGIN
  -- Get caller's user ID
  caller_user_id := auth.uid();
  
  -- Prevent self-role elevation
  IF caller_user_id = target_user_id THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'role_change_attempt_blocked',
      jsonb_build_object(
        'reason', 'self_elevation_attempt',
        'target_role', new_role,
        'blocked_at', NOW(),
        'severity', 'HIGH'
      )
    );
    RAISE EXCEPTION 'Users cannot modify their own roles for security reasons';
  END IF;
  
  -- Check if caller is admin of the target venue
  SELECT public.is_admin(caller_user_id, target_venue_id) INTO caller_is_admin;
  
  IF NOT caller_is_admin THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'unauthorized_role_change_attempt',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'caller_role', 'unknown'
      )
    );
    RAISE EXCEPTION 'Insufficient permissions to modify user roles';
  END IF;
  
  -- Get current roles for logging and validation
  SELECT ur.role INTO caller_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = caller_user_id AND ur.venue_id = target_venue_id;
  
  SELECT ur.role INTO target_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = target_user_id AND ur.venue_id = target_venue_id;
  
  -- CRITICAL FIX: Only owners can create or modify owner roles
  IF new_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_elevation_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'reason', 'only_owners_can_create_owners'
      )
    );
    RAISE EXCEPTION 'Only venue owners can grant owner privileges';
  END IF;
  
  -- Prevent owners from being demoted by non-owners
  IF target_current_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_demotion_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW(),
        'severity', 'CRITICAL',
        'reason', 'insufficient_permissions'
      )
    );
    RAISE EXCEPTION 'Only owners can modify owner roles';
  END IF;
  
  -- Prevent removing the last owner (business continuity)
  IF target_current_role = 'owner' AND new_role != 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM public.user_roles ur
    WHERE ur.venue_id = target_venue_id AND ur.role = 'owner' AND ur.user_id != target_user_id;
    
    IF owner_count = 0 THEN
      INSERT INTO public.security_audit (
        user_id, venue_id, event_type, event_details
      ) VALUES (
        caller_user_id, target_venue_id, 'last_owner_removal_blocked',
        jsonb_build_object(
          'target_user_id', target_user_id,
          'blocked_at', NOW(),
          'severity', 'HIGH',
          'reason', 'cannot_remove_last_owner'
        )
      );
      RAISE EXCEPTION 'Cannot remove the last owner from a venue';
    END IF;
  END IF;
  
  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, assigned_by = caller_user_id, assigned_at = NOW()
  WHERE user_id = target_user_id AND venue_id = target_venue_id;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id AND venue_id = target_venue_id;
  
  -- Log successful role change with enhanced details
  INSERT INTO public.security_audit (
    user_id, venue_id, event_type, event_details
  ) VALUES (
    caller_user_id, target_venue_id, 'role_change_successful',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'changed_by_role', caller_current_role,
      'changed_at', NOW(),
      'severity', 'MEDIUM',
      'action_type', 'role_modification'
    )
  );
  
  RETURN TRUE;
END;
$function$;

-- 2. Update setup_venue_atomic function with secure search_path
CREATE OR REPLACE FUNCTION public.setup_venue_atomic(p_user_id uuid, p_email text, p_first_name text, p_last_name text, p_venue_name text, p_venue_slug text, p_venue_email text, p_venue_phone text, p_venue_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  venue_record RECORD;
  result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Create venue
    INSERT INTO public.venues (name, slug, email, phone, address, approval_status)
    VALUES (p_venue_name, p_venue_slug, p_venue_email, p_venue_phone, p_venue_address, 'pending')
    RETURNING * INTO venue_record;
    
    -- Create/Update profile
    INSERT INTO public.profiles (
      id, venue_id, email, first_name, last_name, role, is_active
    ) VALUES (
      p_user_id, venue_record.id, p_email, p_first_name, p_last_name, 'owner', true
    )
    ON CONFLICT (id) DO UPDATE SET
      venue_id = venue_record.id,
      first_name = p_first_name,
      last_name = p_last_name,
      role = 'owner',
      is_active = true;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, venue_id, role)
    VALUES (p_user_id, venue_record.id, 'owner')
    ON CONFLICT (user_id, venue_id, role) DO NOTHING;
    
    -- Return success with venue data
    result := json_build_object(
      'success', true,
      'venue', row_to_json(venue_record)
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error details
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN result;
  END;
END;
$function$;

-- 3. Update other critical security definer functions
CREATE OR REPLACE FUNCTION public.assign_automatic_tags(guest_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  guest_record RECORD;
  stats_record RECORD;
  tag_record RECORD;
BEGIN
  -- Get guest info
  SELECT * INTO guest_record FROM public.guests WHERE id = guest_id_param;
  
  -- Get guest statistics
  SELECT * INTO stats_record FROM public.calculate_guest_stats(guest_record.email, guest_record.phone);
  
  -- Remove all existing automatic tags for this guest
  DELETE FROM public.guest_tags 
  WHERE guest_id = guest_id_param 
    AND assigned_by = 'system';
  
  -- Assign tags based on criteria
  FOR tag_record IN SELECT * FROM public.tags WHERE is_automatic = true LOOP
    CASE tag_record.name
      WHEN 'First-Time' THEN
        IF stats_record.visit_count = 1 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Repeat' THEN
        IF stats_record.visit_count BETWEEN 2 AND 4 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Frequent' THEN
        IF stats_record.visit_count >= 5 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Recent' THEN
        IF stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Lapsed' THEN
        IF stats_record.last_visit_date < CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Bulk Booker' THEN
        IF stats_record.bulk_booking_count > 0 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Early Bird' THEN
        IF stats_record.early_bird_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Last-Minute Booker' THEN
        IF stats_record.last_minute_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'No-Show Risk' THEN
        IF stats_record.no_show_count >= 2 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
    END CASE;
  END LOOP;
END;
$function$;

-- 4. Update create_default_email_templates function
CREATE OR REPLACE FUNCTION public.create_default_email_templates(p_venue_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  venue_record RECORD;
  basic_design jsonb;
BEGIN
  -- Get venue info
  SELECT name INTO venue_record FROM public.venues WHERE id = p_venue_id;
  
  -- Create a basic Unlayer design template
  basic_design := '{
    "counters": {
      "u_column": 1,
      "u_row": 1,
      "u_content_text": 1,
      "u_content_image": 0,
      "u_content_button": 0,
      "u_content_divider": 0,
      "u_content_html": 0,
      "u_content_social": 0,
      "u_content_video": 0,
      "u_content_menu": 0,
      "u_content_heading": 0,
      "u_content_spacer": 0
    },
    "body": {
      "id": "body",
      "rows": [
        {
          "id": "u_row_1",
          "cells": [1],
          "columns": [
            {
              "id": "u_column_1",
              "contents": [
                {
                  "id": "u_content_text_1",
                  "type": "text",
                  "values": {
                    "containerPadding": "10px",
                    "anchor": "",
                    "fontSize": "14px",
                    "textAlign": "left",
                    "lineHeight": "1.4",
                    "text": "<p>Template content will be loaded here...</p>",
                    "_meta": {
                      "htmlID": "u_content_text_1",
                      "htmlClassNames": ""
                    }
                  }
                }
              ],
              "values": {
                "backgroundColor": "",
                "padding": "0px",
                "border": {},
                "borderRadius": "0px",
                "_meta": {
                  "htmlID": "u_column_1",
                  "htmlClassNames": ""
                }
              }
            }
          ],
          "values": {
            "displayCondition": null,
            "columns": false,
            "backgroundColor": "",
            "padding": "0px",
            "anchor": "",
            "hideDesktop": false,
            "_meta": {
              "htmlID": "u_row_1",
              "htmlClassNames": ""
            }
          }
        }
      ],
      "headers": [],
      "footers": [],
      "values": {
        "popupPosition": "center",
        "popupWidth": "600px",
        "popupHeight": "auto",
        "borderRadius": "0px",
        "contentAlign": "center",
        "contentVerticalAlign": "center",
        "contentWidth": "600px",
        "fontFamily": {
          "label": "Arial",
          "value": "arial,helvetica,sans-serif"
        },
        "preheaderText": "",
        "textColor": "#000000",
        "backgroundColor": "#ffffff",
        "_meta": {
          "htmlID": "u_body",
          "htmlClassNames": ""
        }
      }
    }
  }';
  
  -- Insert all default templates including the new payment-related ones
  INSERT INTO public.email_templates (venue_id, template_key, template_type, subject, html_content, description, is_active, auto_send, design_json)
  VALUES 
    -- Existing templates (keeping them for completeness)
    (p_venue_id, 'booking_confirmation', 'venue', 
     'Booking Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for your booking at {{venue_name}}.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent immediately after a booking is confirmed',
     true, true, basic_design)
  ON CONFLICT (venue_id, template_key) DO NOTHING;
END;
$function$;

-- 5. Update other functions with security definer that need search_path
CREATE OR REPLACE FUNCTION public.merge_guests(primary_guest_id uuid, duplicate_guest_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  primary_guest RECORD;
  duplicate_guest RECORD;
BEGIN
  -- Get both guest records
  SELECT * INTO primary_guest FROM public.guests WHERE id = primary_guest_id;
  SELECT * INTO duplicate_guest FROM public.guests WHERE id = duplicate_guest_id;
  
  -- Update primary guest with best available data
  UPDATE public.guests SET
    name = COALESCE(
      CASE WHEN LENGTH(TRIM(primary_guest.name)) > LENGTH(TRIM(duplicate_guest.name)) 
           THEN primary_guest.name 
           ELSE duplicate_guest.name 
      END,
      primary_guest.name
    ),
    email = COALESCE(primary_guest.email, duplicate_guest.email),
    phone = COALESCE(primary_guest.phone, duplicate_guest.phone),
    notes = CASE 
      WHEN primary_guest.notes IS NOT NULL AND duplicate_guest.notes IS NOT NULL 
      THEN primary_guest.notes || E'\n--- Merged Notes ---\n' || duplicate_guest.notes
      ELSE COALESCE(primary_guest.notes, duplicate_guest.notes)
    END,
    import_visit_count = GREATEST(
      COALESCE(primary_guest.import_visit_count, 0),
      COALESCE(duplicate_guest.import_visit_count, 0)
    ),
    import_last_visit_date = GREATEST(
      primary_guest.import_last_visit_date,
      duplicate_guest.import_last_visit_date
    ),
    updated_at = NOW()
  WHERE id = primary_guest_id;
  
  -- Transfer guest_tags from duplicate to primary (avoid duplicates)
  INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, assigned_at)
  SELECT primary_guest_id, tag_id, assigned_by, assigned_at
  FROM public.guest_tags 
  WHERE guest_id = duplicate_guest_id
  AND NOT EXISTS (
    SELECT 1 FROM public.guest_tags 
    WHERE guest_id = primary_guest_id AND tag_id = guest_tags.tag_id
  );
  
  -- Delete the duplicate guest (this will cascade delete guest_tags due to foreign key)
  DELETE FROM public.guests WHERE id = duplicate_guest_id;
  
  RETURN primary_guest_id;
END;
$function$;

-- 6. Add security logging for function updates
INSERT INTO public.security_audit (
  event_type, 
  event_details
) VALUES (
  'security_hardening_applied',
  jsonb_build_object(
    'functions_updated', ARRAY[
      'update_user_role',
      'setup_venue_atomic', 
      'assign_automatic_tags',
      'create_default_email_templates',
      'merge_guests'
    ],
    'security_improvement', 'search_path hardening applied',
    'timestamp', NOW(),
    'severity', 'MEDIUM'
  )
);
