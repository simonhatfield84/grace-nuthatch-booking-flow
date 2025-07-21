
// Service to create simple Unlayer-native email templates
export const unlayerTemplateService = {
  
  // Generate a simple Unlayer design with basic structure
  createSimpleDesign(templateType: string, venueVariables: { [key: string]: string } = {}) {
    const baseDesign = {
      counters: {
        u_column: 1,
        u_row: 5,
        u_content_text: 5,
        u_content_image: 1,
        u_content_button: 2,
        u_content_divider: 1,
        u_content_spacer: 1
      },
      body: {
        id: "body",
        rows: [
          // Header with logo
          {
            id: "u_row_1",
            cells: [1],
            columns: [{
              id: "u_column_1",
              contents: [{
                id: "u_content_image_1",
                type: "image",
                values: {
                  containerPadding: "20px",
                  anchor: "",
                  src: {
                    url: "/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png",
                    width: 150,
                    height: 60
                  },
                  textAlign: "center",
                  altText: "Logo",
                  _meta: {
                    htmlID: "u_content_image_1",
                    htmlClassNames: ""
                  }
                }
              }],
              values: {
                backgroundColor: "",
                padding: "0px",
                _meta: {
                  htmlID: "u_column_1",
                  htmlClassNames: ""
                }
              }
            }],
            values: {
              backgroundColor: "#ffffff",
              padding: "0px",
              _meta: {
                htmlID: "u_row_1",
                htmlClassNames: ""
              }
            }
          },
          
          // Title
          {
            id: "u_row_2",
            cells: [1],
            columns: [{
              id: "u_column_2",
              contents: [{
                id: "u_content_text_1",
                type: "text",
                values: {
                  containerPadding: "20px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "#1e293b",
                  text: this.getTitleForTemplate(templateType),
                  _meta: {
                    htmlID: "u_content_text_1",
                    htmlClassNames: ""
                  }
                }
              }],
              values: {
                backgroundColor: "",
                padding: "0px",
                _meta: {
                  htmlID: "u_column_2",
                  htmlClassNames: ""
                }
              }
            }],
            values: {
              backgroundColor: "#f8fafc",
              padding: "20px",
              _meta: {
                htmlID: "u_row_2",
                htmlClassNames: ""
              }
            }
          },

          // Main content
          {
            id: "u_row_3",
            cells: [1],
            columns: [{
              id: "u_column_3",
              contents: [{
                id: "u_content_text_2",
                type: "text",
                values: {
                  containerPadding: "20px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#374151",
                  text: this.getContentForTemplate(templateType),
                  _meta: {
                    htmlID: "u_content_text_2",
                    htmlClassNames: ""
                  }
                }
              }],
              values: {
                backgroundColor: "",
                padding: "0px",
                _meta: {
                  htmlID: "u_column_3",
                  htmlClassNames: ""
                }
              }
            }],
            values: {
              backgroundColor: "#ffffff",
              padding: "20px",
              _meta: {
                htmlID: "u_row_3",
                htmlClassNames: ""
              }
            }
          },

          // Booking details box
          {
            id: "u_row_4",
            cells: [1],
            columns: [{
              id: "u_column_4",
              contents: [{
                id: "u_content_text_3",
                type: "text",
                values: {
                  containerPadding: "20px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "#000000",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  text: this.getBookingDetailsForTemplate(templateType),
                  _meta: {
                    htmlID: "u_content_text_3",
                    htmlClassNames: ""
                  }
                }
              }],
              values: {
                backgroundColor: "",
                padding: "20px",
                _meta: {
                  htmlID: "u_column_4",
                  htmlClassNames: ""
                }
              }
            }],
            values: {
              backgroundColor: "#f8fafc",
              padding: "20px",
              _meta: {
                htmlID: "u_row_4",
                htmlClassNames: ""
              }
            }
          }
        ],
        values: {
          contentAlign: "center",
          contentWidth: "600px",
          fontFamily: {
            label: "Arial",
            value: "arial,helvetica,sans-serif"
          },
          backgroundColor: "#ffffff",
          _meta: {
            htmlID: "u_body",
            htmlClassNames: ""
          }
        }
      }
    };

    // Add action buttons for specific templates
    if (this.shouldHaveActionButtons(templateType)) {
      baseDesign.body.rows.push({
        id: "u_row_5",
        cells: [1],
        columns: [{
          id: "u_column_5",
          contents: [
            {
              id: "u_content_button_1",
              type: "button",
              values: {
                containerPadding: "10px",
                buttonColors: {
                  color: "#ffffff",
                  backgroundColor: "#000000",
                  hoverColor: "#ffffff",
                  hoverBackgroundColor: "#374151"
                },
                size: {
                  autoWidth: true,
                  width: "150px"
                },
                text: "Modify Booking",
                href: "{{modify_link}}",
                _meta: {
                  htmlID: "u_content_button_1",
                  htmlClassNames: ""
                }
              }
            },
            {
              id: "u_content_button_2", 
              type: "button",
              values: {
                containerPadding: "10px",
                buttonColors: {
                  color: "#ffffff",
                  backgroundColor: "#000000",
                  hoverColor: "#ffffff",
                  hoverBackgroundColor: "#374151"
                },
                size: {
                  autoWidth: true,
                  width: "150px"
                },
                text: "Cancel Booking",
                href: "{{cancel_link}}",
                _meta: {
                  htmlID: "u_content_button_2",
                  htmlClassNames: ""
                }
              }
            }
          ],
          values: {
            backgroundColor: "",
            padding: "0px",
            _meta: {
              htmlID: "u_column_5",
              htmlClassNames: ""
            }
          }
        }],
        values: {
          backgroundColor: "#f8fafc",
          padding: "20px",
          _meta: {
            htmlID: "u_row_5",
            htmlClassNames: ""
          }
        }
      });
    }

    // Add footer
    baseDesign.body.rows.push({
      id: `u_row_${baseDesign.body.rows.length + 1}`,
      cells: [1],
      columns: [{
        id: `u_column_${baseDesign.body.rows.length + 1}`,
        contents: [{
          id: "u_content_text_footer",
          type: "text",
          values: {
            containerPadding: "20px",
            fontSize: "12px",
            textAlign: "center",
            color: "#94a3b8",
            text: "<p>{{email_signature}}</p><p style=\"margin-top: 20px; font-size: 10px; color: #999;\">Powered by Grace</p>",
            _meta: {
              htmlID: "u_content_text_footer",
              htmlClassNames: ""
            }
          }
        }],
        values: {
          backgroundColor: "",
          padding: "0px",
          _meta: {
            htmlID: `u_column_${baseDesign.body.rows.length + 1}`,
            htmlClassNames: ""
          }
        }
      }],
      values: {
        backgroundColor: "#ffffff",
        padding: "20px",
        _meta: {
          htmlID: `u_row_${baseDesign.body.rows.length + 1}`,
          htmlClassNames: ""
        }
      }
    });

    return baseDesign;
  },

  getTitleForTemplate(templateType: string): string {
    const titles = {
      'booking_confirmation': '<h2>Your booking is confirmed!</h2>',
      'booking_reminder_24h': '<h2>Your booking is tomorrow!</h2>',
      'booking_reminder_2h': '<h2>Your booking is in 2 hours!</h2>',
      'booking_cancelled': '<h2>Your booking has been cancelled</h2>',
      'booking_modified': '<h2>Your booking has been updated</h2>',
      'booking_no_show': '<h2>We missed you today</h2>',
      'walk_in_confirmation': '<h2>Thanks for visiting us!</h2>'
    };
    return titles[templateType as keyof typeof titles] || '<h2>Email Template</h2>';
  },

  getContentForTemplate(templateType: string): string {
    const content = {
      'booking_confirmation': '<p>Dear {{guest_name}},</p><p>Thank you for your booking at {{venue_name}}. We look forward to seeing you!</p>',
      'booking_reminder_24h': '<p>Dear {{guest_name}},</p><p>This is a friendly reminder about your booking at {{venue_name}} tomorrow.</p>',
      'booking_reminder_2h': '<p>Dear {{guest_name}},</p><p>Your booking at {{venue_name}} is coming up in just 2 hours.</p>',
      'booking_cancelled': '<p>Dear {{guest_name}},</p><p>Your booking at {{venue_name}} has been cancelled as requested.</p>',
      'booking_modified': '<p>Dear {{guest_name}},</p><p>Your booking at {{venue_name}} has been successfully updated.</p>',
      'booking_no_show': '<p>Dear {{guest_name}},</p><p>We noticed you weren\'t able to make it to your booking at {{venue_name}} today.</p>',
      'walk_in_confirmation': '<p>Dear {{guest_name}},</p><p>Thank you for visiting {{venue_name}} today as a walk-in guest.</p>'
    };
    return content[templateType as keyof typeof content] || '<p>Dear {{guest_name}},</p><p>This is your email from {{venue_name}}.</p>';
  },

  getBookingDetailsForTemplate(templateType: string): string {
    const isVisit = templateType === 'walk_in_confirmation';
    const isNoShow = templateType === 'booking_no_show';
    
    let title = 'Booking Details';
    if (isVisit) title = 'Visit Details';
    if (isNoShow) title = 'Missed Booking Details';
    if (templateType === 'booking_cancelled') title = 'Cancelled Booking Details';
    if (templateType === 'booking_modified') title = 'Updated Booking Details';

    return `<h3 style="margin-top: 0; color: #000000;">${title}</h3>
<p><strong>Reference:</strong> {{booking_reference}}</p>
<p><strong>Date:</strong> {{booking_date}}</p>
<p><strong>Time:</strong> {{booking_time}}</p>
<p><strong>Party Size:</strong> {{party_size}}</p>
<p><strong>Venue:</strong> {{venue_name}}</p>`;
  },

  shouldHaveActionButtons(templateType: string): boolean {
    return ['booking_confirmation', 'booking_reminder_24h', 'booking_reminder_2h', 'booking_modified'].includes(templateType);
  },

  // Generate simple HTML from design (fallback)
  generateSimpleHTML(templateType: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="Logo" style="height: 60px; width: auto; margin: 20px 0;" />
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          ${this.getTitleForTemplate(templateType)}
          ${this.getContentForTemplate(templateType)}
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            ${this.getBookingDetailsForTemplate(templateType)}
          </div>
          ${this.shouldHaveActionButtons(templateType) ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          ` : ''}
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  }
};
