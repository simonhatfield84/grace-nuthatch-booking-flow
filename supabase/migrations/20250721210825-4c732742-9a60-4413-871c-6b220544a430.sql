-- Update the create_default_email_templates function to include design_json
CREATE OR REPLACE FUNCTION public.create_default_email_templates(p_venue_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
  
  -- Insert default templates with both HTML and design_json
  INSERT INTO public.email_templates (venue_id, template_key, template_type, subject, html_content, description, is_active, auto_send, design_json)
  VALUES 
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
     true, true, basic_design),
     
    (p_venue_id, 'booking_reminder_24h', 'venue',
     'Booking Reminder - Tomorrow at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is tomorrow!</h2>
          <p>Dear {{guest_name}},</p>
          <p>This is a friendly reminder about your booking at {{venue_name}} tomorrow.</p>
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
     'Sent 24 hours before the booking',
     true, false, basic_design),
     
    (p_venue_id, 'booking_reminder_2h', 'venue',
     'Booking Reminder - In 2 Hours at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is in 2 hours!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} is coming up in just 2 hours.</p>
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
          <p>We look forward to seeing you soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent 2 hours before the booking',
     true, false, basic_design),
     
    (p_venue_id, 'booking_cancelled', 'venue',
     'Booking Cancelled - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Cancelled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been cancelled</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been cancelled as requested.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Cancelled Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We hope to see you again soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is cancelled',
     true, true, basic_design),
     
    (p_venue_id, 'booking_modified', 'venue',
     'Booking Modified - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Modified</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been updated</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been successfully updated.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Updated Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Again</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is modified',
     true, true, basic_design),
     
    (p_venue_id, 'booking_no_show', 'venue',
     'Missed Booking - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Missed Booking</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">We missed you today</h2>
          <p>Dear {{guest_name}},</p>
          <p>We noticed you weren''t able to make it to your booking at {{venue_name}} today.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Missed Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We understand that plans can change. We''d love to welcome you another time!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is marked as no-show',
     true, false, basic_design),
     
    (p_venue_id, 'walk_in_confirmation', 'venue',
     'Walk-in Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Walk-in Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Thanks for visiting us!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for visiting {{venue_name}} today as a walk-in guest.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Visit Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We hope you enjoyed your experience and look forward to welcoming you back soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a walk-in visit is recorded',
     true, false, basic_design)
  ON CONFLICT (venue_id, template_key) DO NOTHING;
END;
$function$