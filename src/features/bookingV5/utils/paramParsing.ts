import { isValid, parse } from 'date-fns';

export interface URLPrefill {
  party?: number;
  date?: Date;
  service?: string;
}

export function parseURLPrefill(searchParams: URLSearchParams): URLPrefill {
  const result: URLPrefill = {};
  
  // Parse party size
  const partyStr = searchParams.get('party');
  if (partyStr) {
    const party = parseInt(partyStr, 10);
    if (!isNaN(party) && party > 0 && party <= 50) {
      result.party = party;
    }
  }
  
  // Parse date (YYYY-MM-DD format)
  const dateStr = searchParams.get('date');
  if (dateStr) {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (isValid(date) && date >= new Date(new Date().setHours(0, 0, 0, 0))) {
        result.date = date;
      }
    } catch (e) {
      console.warn('Invalid date param:', dateStr);
    }
  }
  
  // Parse service UUID
  const serviceStr = searchParams.get('service');
  if (serviceStr && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceStr)) {
    result.service = serviceStr;
  }
  
  return result;
}

export function parseVariant(searchParams: URLSearchParams): 'standard' | 'serviceFirst' {
  const variant = searchParams.get('variant');
  return variant === 'serviceFirst' ? 'serviceFirst' : 'standard';
}
