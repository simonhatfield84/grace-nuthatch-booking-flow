
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
              backgroundColor: this.getBackgroundColorForTemplate(templateType),
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
                  fontWeight: "normal",
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
                  fontWeight: "normal",
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
              backgroundColor: this.getBackgroundColorForTemplate(templateType),
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

    // Add special content for payment templates
    if (this.isPaymentTemplate(templateType)) {
      const paymentRow = this.createPaymentRow(templateType);
      baseDesign.body.rows.splice(-1, 0, paymentRow); // Insert before last row
    }

    // Add action buttons for specific templates
    if (this.shouldHaveActionButtons(templateType)) {
      baseDesign.body.rows.push({
        id: "u_row_5",
        cells: [1],
        columns: [{
          id: "u_column_5",
          contents: [{
            id: "u_content_text_buttons",
            type: "text",
            values: {
              containerPadding: "20px",
              fontSize: "14px",
              fontWeight: "normal",
              textAlign: "center",
              color: "#000000",
              text: this.getActionButtonsForTemplate(templateType),
              _meta: {
                htmlID: "u_content_text_buttons",
                htmlClassNames: ""
              }
            }
          }],
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
          backgroundColor: this.getBackgroundColorForTemplate(templateType),
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
            fontWeight: "normal",
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
      'payment_request': '<h2>Payment Required for Your Booking</h2>',
      'payment_reminder_22h': '<h2>⏰ Only 2 Hours Left to Complete Payment</h2>',
      'payment_expired_24h': '<h2>Booking Payment Window Expired</h2>',
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
      'payment_request': '<p>Dear {{guest_name}},</p><p>Your booking at {{venue_name}} requires payment to be confirmed.</p>',
      'payment_reminder_22h': '<p>Dear {{guest_name}},</p><p>This is a friendly reminder that your booking payment is due soon!</p>',
      'payment_expired_24h': '<p>Dear {{guest_name}},</p><p>Unfortunately, the payment window for your booking at {{venue_name}} has expired.</p>',
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
    const isPayment = this.isPaymentTemplate(templateType);
    
    let title = 'Booking Details';
    if (isVisit) title = 'Visit Details';
    if (isNoShow) title = 'Missed Booking Details';
    if (templateType === 'booking_cancelled') title = 'Cancelled Booking Details';
    if (templateType === 'booking_modified') title = 'Updated Booking Details';
    if (templateType === 'payment_expired_24h') title = 'Expired Booking Details';

    let baseDetails = `<h3 style="margin-top: 0; color: #000000;">${title}</h3>
<p><strong>Reference:</strong> {{booking_reference}}</p>
<p><strong>Date:</strong> {{booking_date}}</p>
<p><strong>Time:</strong> {{booking_time}}</p>
<p><strong>Party Size:</strong> {{party_size}}</p>
<p><strong>Venue:</strong> {{venue_name}}</p>`;

    // Add service and amount for payment templates
    if (isPayment) {
      baseDetails += `
<p><strong>Service:</strong> {{service}}</p>
<p><strong>Amount:</strong> {{payment_amount}}</p>`;
    }

    return baseDetails;
  },

  createPaymentRow(templateType: string): any {
    if (templateType === 'payment_request') {
      return {
        id: "u_row_payment",
        cells: [1],
        columns: [{
          id: "u_column_payment",
          contents: [{
            id: "u_content_payment",
            type: "text",
            values: {
              containerPadding: "20px",
              fontSize: "14px",
              fontWeight: "normal",
              lineHeight: "1.5",
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              border: "4px solid #ef4444",
              borderRadius: "8px",
              text: `<h3 style="margin-top: 0; color: #dc2626;">Payment Required</h3>
<p><strong>Amount:</strong> {{payment_amount}}</p>
<p>Please complete your payment within 24 hours to confirm your booking.</p>
{{#custom_message}}<p><em>"{{custom_message}}"</em></p>{{/custom_message}}
<div style="text-align: center; margin: 30px 0;">
  <a href="{{payment_link}}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
    Complete Payment Now
  </a>
</div>
<div style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
  <p>⏰ This payment request expires in 24 hours</p>
</div>`,
              _meta: {
                htmlID: "u_content_payment",
                htmlClassNames: ""
              }
            }
          }],
          values: {
            backgroundColor: "",
            padding: "0px",
            _meta: {
              htmlID: "u_column_payment",
              htmlClassNames: ""
            }
          }
        }],
        values: {
          backgroundColor: "#f8fafc",
          padding: "20px",
          _meta: {
            htmlID: "u_row_payment",
            htmlClassNames: ""
          }
        }
      };
    } else if (templateType === 'payment_reminder_22h') {
      return {
        id: "u_row_payment",
        cells: [1],
        columns: [{
          id: "u_column_payment",
          contents: [{
            id: "u_content_payment",
            type: "text",
            values: {
              containerPadding: "20px",
              fontSize: "14px",
              fontWeight: "normal",
              lineHeight: "1.5",
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              border: "4px solid #ef4444",
              borderRadius: "8px",
              text: `<p><strong>⚠️ Important:</strong> Your payment window expires in approximately 2 hours. After this time, your booking may be cancelled and you will need to rebook.</p>
<div style="text-align: center; margin: 30px 0;">
  <a href="{{payment_link}}" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
    Complete Payment Now
  </a>
</div>`,
              _meta: {
                htmlID: "u_content_payment",
                htmlClassNames: ""
              }
            }
          }],
          values: {
            backgroundColor: "",
            padding: "0px",
            _meta: {
              htmlID: "u_column_payment",
              htmlClassNames: ""
            }
          }
        }],
        values: {
          backgroundColor: "#fffbeb",
          padding: "20px",
          _meta: {
            htmlID: "u_row_payment",
            htmlClassNames: ""
          }
        }
      };
    } else if (templateType === 'payment_expired_24h') {
      return {
        id: "u_row_payment",
        cells: [1],
        columns: [{
          id: "u_column_payment",
          contents: [{
            id: "u_content_payment",
            type: "text",
            values: {
              containerPadding: "20px",
              fontSize: "14px",
              fontWeight: "normal",
              lineHeight: "1.5",
              color: "#dc2626",
              backgroundColor: "#fee",
              borderRadius: "8px",
              text: `<p><strong>What happens next:</strong></p>
<p>• Your booking has been cancelled due to non-payment</p>
<p>• Your table is now available for other guests</p>
<p>• You are welcome to make a new booking at any time</p>`,
              _meta: {
                htmlID: "u_content_payment",
                htmlClassNames: ""
              }
            }
          }],
          values: {
            backgroundColor: "",
            padding: "0px",
            _meta: {
              htmlID: "u_column_payment",
              htmlClassNames: ""
            }
          }
        }],
        values: {
          backgroundColor: "#fef2f2",
          padding: "20px",
          _meta: {
            htmlID: "u_row_payment",
            htmlClassNames: ""
          }
        }
      };
    }
    
    return {};
  },

  getBackgroundColorForTemplate(templateType: string): string {
    const colors = {
      'payment_request': '#fef2f2',
      'payment_reminder_22h': '#fffbeb',
      'payment_expired_24h': '#fef2f2',
      'booking_cancelled': '#f8fafc',
      'booking_no_show': '#f8fafc'
    };
    return colors[templateType as keyof typeof colors] || '#f8fafc';
  },

  getActionButtonsForTemplate(templateType: string): string {
    if (templateType === 'payment_request') {
      return '<div style="text-align: center; margin: 20px 0;"><a href="{{payment_link}}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Complete Payment Now</a></div>';
    }
    
    return '<div style="text-align: center; margin: 20px 0;"><a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a> <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a></div>';
  },

  isPaymentTemplate(templateType: string): boolean {
    return ['payment_request', 'payment_reminder_22h', 'payment_expired_24h'].includes(templateType);
  },

  shouldHaveActionButtons(templateType: string): boolean {
    return ['booking_confirmation', 'booking_reminder_24h', 'booking_reminder_2h', 'booking_modified'].includes(templateType);
  },

  // Generate simple HTML from design (fallback)
  generateSimpleHTML(templateType: string): string {
    const isPayment = this.isPaymentTemplate(templateType);
    const paymentSection = isPayment ? this.getPaymentSectionHTML(templateType) : '';
    const actionButtons = this.shouldHaveActionButtons(templateType) ? `
          <div style="text-align: center; margin: 20px 0;">
            ${templateType === 'payment_request' ? 
              '<a href="{{payment_link}}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">Complete Payment Now</a>' :
              '<a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a> <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>'
            }
          </div>
          ` : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="Logo" style="height: 60px; width: auto; margin: 20px 0;" />
        </div>
        <div style="background: ${this.getBackgroundColorForTemplate(templateType)}; padding: 30px; border-radius: 8px;">
          ${this.getTitleForTemplate(templateType)}
          ${this.getContentForTemplate(templateType)}
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            ${this.getBookingDetailsForTemplate(templateType)}
          </div>
          ${paymentSection}
          ${actionButtons}
          ${templateType === 'booking_no_show' ? '<p>We understand that plans can change. We\'d love to welcome you another time!</p>' : ''}
          ${templateType === 'walk_in_confirmation' ? '<p>We hope you enjoyed your experience and look forward to welcoming you back soon!</p>' : ''}
          ${templateType === 'payment_expired_24h' ? '<p>We understand that sometimes plans change. If you would still like to visit us, please feel free to make a new booking or contact us directly.</p>' : ''}
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;
  },

  getPaymentSectionHTML(templateType: string): string {
    if (templateType === 'payment_request') {
      return `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Payment Required</h3>
          <p><strong>Amount:</strong> {{payment_amount}}</p>
          <p>Please complete your payment within 24 hours to confirm your booking.</p>
          {{#custom_message}}<p><em>"{{custom_message}}"</em></p>{{/custom_message}}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{payment_link}}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            Complete Payment Now
          </a>
        </div>
        <div style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
          <p>⏰ This payment request expires in 24 hours</p>
          <p>If you have any questions, please contact us directly.</p>
        </div>`;
    } else if (templateType === 'payment_reminder_22h') {
      return `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
          <p><strong>⚠️ Important:</strong> Your payment window expires in approximately 2 hours. After this time, your booking may be cancelled and you will need to rebook.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{payment_link}}" style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            Complete Payment Now
          </a>
        </div>`;
    } else if (templateType === 'payment_expired_24h') {
      return `
        <div style="background: #fee; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>What happens next:</strong></p>
          <p>• Your booking has been cancelled due to non-payment</p>
          <p>• Your table is now available for other guests</p>
          <p>• You are welcome to make a new booking at any time</p>
        </div>`;
    }
    return '';
  }
};
