
import Papa from "papaparse";
import { ColumnMapping } from "@/types/guest";

export const parseCsvWithMultipleDelimiters = async (file: File): Promise<{ data: any[], headers: string[] } | null> => {
  const tryDelimiters = [',', ';', '\t', '|'];
  let bestResult = null;
  let bestFieldCount = 0;

  const tryParse = (delimiter: string) => {
    return new Promise<any>((resolve) => {
      Papa.parse(file, {
        header: true,
        delimiter: delimiter,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results);
        },
        error: () => {
          resolve(null);
        }
      });
    });
  };

  const results = await Promise.all(tryDelimiters.map(delimiter => tryParse(delimiter)));
  
  results.forEach((result) => {
    if (result && result.meta.fields && result.meta.fields.length > bestFieldCount) {
      bestFieldCount = result.meta.fields.length;
      bestResult = result;
    }
  });

  if (bestResult && bestResult.errors.length === 0) {
    return {
      data: bestResult.data,
      headers: bestResult.meta.fields || []
    };
  }

  return null;
};

export const autoMapColumns = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {
    name: 'none',
    email: 'none',
    phone: 'none',
    opt_in_marketing: 'none',
    notes: 'none',
    import_visit_count: 'none',
    import_last_visit_date: 'none'
  };

  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    if (lowerHeader.includes('name') && !lowerHeader.includes('email')) {
      mapping.name = header;
    } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
      mapping.email = header;
    } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('tel')) {
      mapping.phone = header;
    } else if (lowerHeader.includes('marketing') || lowerHeader.includes('opt') || lowerHeader.includes('newsletter')) {
      mapping.opt_in_marketing = header;
    } else if (lowerHeader.includes('note') || lowerHeader.includes('comment') || lowerHeader.includes('remark')) {
      mapping.notes = header;
    } else if (lowerHeader.includes('visit') && lowerHeader.includes('count')) {
      mapping.import_visit_count = header;
    } else if (lowerHeader.includes('last') && lowerHeader.includes('visit')) {
      mapping.import_last_visit_date = header;
    }
  });

  return mapping;
};
