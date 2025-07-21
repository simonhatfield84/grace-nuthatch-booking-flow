/**
 * Utility functions for converting HTML email templates to Unlayer JSON designs
 */

export interface UnlayerDesign {
  counters: {
    u_column: number;
    u_row: number;
    u_content_text: number;
    u_content_image: number;
    u_content_button: number;
    u_content_divider: number;
    u_content_html: number;
    u_content_social: number;
    u_content_video: number;
    u_content_menu: number;
    u_content_heading: number;
    u_content_spacer: number;
  };
  body: {
    id: string;
    rows: UnlayerRow[];
    headers: any[];
    footers: any[];
    values: {
      popupPosition: string;
      popupWidth: string;
      popupHeight: string;
      borderRadius: string;
      contentAlign: string;
      contentVerticalAlign: string;
      contentWidth: string;
      fontFamily: {
        label: string;
        value: string;
      };
      preheaderText: string;
      textColor: string;
      backgroundColor: string;
      backgroundImage: {
        url: string;
        fullWidth: boolean;
        repeat: boolean;
        size: string;
        position: string;
      };
      linkStyle: {
        body: boolean;
        linkColor: string;
        linkHoverColor: string;
        linkUnderline: boolean;
        linkHoverUnderline: boolean;
      };
      _meta: {
        htmlID: string;
        htmlClassNames: string;
      };
    };
  };
}

export interface UnlayerRow {
  id: string;
  cells: number[];
  columns: UnlayerColumn[];
  values: {
    displayCondition: string | null;
    columns: boolean;
    backgroundColor: string;
    backgroundImage: {
      url: string;
      fullWidth: boolean;
      repeat: boolean;
      size: string;
      position: string;
    };
    padding: string;
    anchor: string;
    hideDesktop: boolean;
    _meta: {
      htmlID: string;
      htmlClassNames: string;
    };
  };
}

export interface UnlayerColumn {
  id: string;
  contents: UnlayerContent[];
  values: {
    backgroundColor: string;
    padding: string;
    border: {};
    borderRadius: string;
    _meta: {
      htmlID: string;
      htmlClassNames: string;
    };
  };
}

export interface UnlayerContent {
  id: string;
  type: string;
  values: any;
}

/**
 * Creates a basic Unlayer design template structure
 */
export function createBasicUnlayerTemplate(): UnlayerDesign {
  return {
    counters: {
      u_column: 1,
      u_row: 1,
      u_content_text: 1,
      u_content_image: 0,
      u_content_button: 0,
      u_content_divider: 0,
      u_content_html: 0,
      u_content_social: 0,
      u_content_video: 0,
      u_content_menu: 0,
      u_content_heading: 0,
      u_content_spacer: 0,
    },
    body: {
      id: "body",
      rows: [],
      headers: [],
      footers: [],
      values: {
        popupPosition: "center",
        popupWidth: "600px",
        popupHeight: "auto",
        borderRadius: "0px",
        contentAlign: "center",
        contentVerticalAlign: "center",
        contentWidth: "600px",
        fontFamily: {
          label: "Arial",
          value: "arial,helvetica,sans-serif"
        },
        preheaderText: "",
        textColor: "#000000",
        backgroundColor: "#ffffff",
        backgroundImage: {
          url: "",
          fullWidth: true,
          repeat: false,
          size: "cover",
          position: "center"
        },
        linkStyle: {
          body: true,
          linkColor: "#0000ee",
          linkHoverColor: "#0000ee",
          linkUnderline: true,
          linkHoverUnderline: true
        },
        _meta: {
          htmlID: "u_body",
          htmlClassNames: ""
        }
      }
    }
  };
}

/**
 * Creates a simple text content block for Unlayer
 */
export function createTextContent(id: string, html: string): UnlayerContent {
  return {
    id: id,
    type: "text",
    values: {
      containerPadding: "10px",
      anchor: "",
      fontSize: "14px",
      textAlign: "left",
      lineHeight: "1.4",
      linkStyle: {
        inherit: true,
        linkColor: "#0000ee",
        linkHoverColor: "#0000ee",
        linkUnderline: true,
        linkHoverUnderline: true
      },
      hideDesktop: false,
      displayCondition: null,
      text: html,
      _meta: {
        htmlID: "u_content_text_1",
        htmlClassNames: ""
      }
    }
  };
}

/**
 * Creates a basic single-column row for Unlayer
 */
export function createSingleColumnRow(id: string, content: UnlayerContent): UnlayerRow {
  return {
    id: id,
    cells: [1],
    columns: [
      {
        id: `${id}_column_1`,
        contents: [content],
        values: {
          backgroundColor: "",
          padding: "0px",
          border: {},
          borderRadius: "0px",
          _meta: {
            htmlID: `u_column_${id.split('_')[2]}`,
            htmlClassNames: ""
          }
        }
      }
    ],
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor: "",
      backgroundImage: {
        url: "",
        fullWidth: true,
        repeat: false,
        size: "cover",
        position: "center"
      },
      padding: "0px",
      anchor: "",
      hideDesktop: false,
      _meta: {
        htmlID: `u_row_${id.split('_')[2]}`,
        htmlClassNames: ""
      }
    }
  };
}

/**
 * Converts an HTML email template to a basic Unlayer design
 */
export function convertHtmlToUnlayerDesign(html: string): UnlayerDesign {
  const design = createBasicUnlayerTemplate();
  
  // Create a simple text content block with the HTML
  const textContent = createTextContent("u_content_text_1", html);
  
  // Create a single row with the text content
  const row = createSingleColumnRow("u_row_1", textContent);
  
  // Add the row to the design
  design.body.rows = [row];
  
  return design;
}

/**
 * Migrates an existing email template to include Unlayer design JSON
 */
export function migrateTemplateToUnlayer(htmlContent: string): {
  design_json: UnlayerDesign;
  migrated: boolean;
} {
  try {
    const design = convertHtmlToUnlayerDesign(htmlContent);
    return {
      design_json: design,
      migrated: true
    };
  } catch (error) {
    console.error('Failed to migrate template to Unlayer:', error);
    return {
      design_json: createBasicUnlayerTemplate(),
      migrated: false
    };
  }
}

/**
 * Creates default Unlayer designs for common email templates
 */
export function createDefaultEmailDesigns() {
  const designs: Record<string, UnlayerDesign> = {};

  // Booking confirmation design
  designs.booking_confirmation = convertHtmlToUnlayerDesign(`
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
    <p>We look forward to seeing you!</p>
  `);

  return designs;
}