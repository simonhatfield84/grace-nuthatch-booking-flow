
import { CSVRow, ColumnMapping } from "@/types/guest";

export const validateCsvData = (csvData: CSVRow[], columnMapping: ColumnMapping) => {
  const validationErrors: string[] = [];
  const guests: any[] = [];

  if (columnMapping.name === 'none') {
    validationErrors.push("Name column mapping is required");
    return { errors: validationErrors, guests: [] };
  }

  csvData.forEach((row, index) => {
    const guest: any = {};
    
    // Name is required
    const name = row[columnMapping.name]?.trim();
    if (!name) {
      validationErrors.push(`Row ${index + 1}: Name is required`);
      return;
    }
    guest.name = name;

    // Email
    if (columnMapping.email && columnMapping.email !== 'none') {
      const email = row[columnMapping.email]?.trim();
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          validationErrors.push(`Row ${index + 1}: Invalid email format`);
          return;
        }
        guest.email = email;
      }
    }

    // Phone
    if (columnMapping.phone && columnMapping.phone !== 'none') {
      const phone = row[columnMapping.phone]?.trim();
      if (phone) {
        guest.phone = phone;
      }
    }

    // Marketing opt-in - DEFAULT TO TRUE if no value provided
    if (columnMapping.opt_in_marketing && columnMapping.opt_in_marketing !== 'none') {
      const optIn = row[columnMapping.opt_in_marketing]?.trim().toLowerCase();
      guest.opt_in_marketing = optIn ? ['true', '1', 'yes', 'y', 'on'].includes(optIn) : true;
    } else {
      guest.opt_in_marketing = true; // Default to opted in
    }

    // Notes
    if (columnMapping.notes && columnMapping.notes !== 'none') {
      const notes = row[columnMapping.notes]?.trim();
      if (notes) {
        guest.notes = notes;
      }
    }

    // Import visit count
    if (columnMapping.import_visit_count && columnMapping.import_visit_count !== 'none') {
      const visitCount = row[columnMapping.import_visit_count]?.trim();
      if (visitCount && !isNaN(parseInt(visitCount))) {
        guest.import_visit_count = parseInt(visitCount);
      }
    }

    // Import last visit date
    if (columnMapping.import_last_visit_date && columnMapping.import_last_visit_date !== 'none') {
      const lastVisit = row[columnMapping.import_last_visit_date]?.trim();
      if (lastVisit) {
        const date = new Date(lastVisit);
        if (!isNaN(date.getTime())) {
          guest.import_last_visit_date = date.toISOString().split('T')[0];
        }
      }
    }

    // Add temporary ID for duplicate detection
    guest.tempId = `temp_${index}`;
    guests.push(guest);
  });

  return { errors: validationErrors, guests };
};
