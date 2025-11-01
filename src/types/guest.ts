
export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  opt_in_marketing: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  import_visit_count?: number | null;
  import_last_visit_date?: string | null;
  tags?: Tag[];
  visit_count?: number;
  last_visit_date?: string;
  square_customer_id?: string | null;
  square_reference_id?: string | null;
  square_customer_raw?: any;
  actual_visit_count?: number;
  total_spend_cents?: number;
  average_spend_per_visit_cents?: number;
  average_spend_per_cover_cents?: number;
  last_actual_visit_date?: string;
  predicted_ltv_cents?: number | null;
  ltv_segment?: string | null;
  churn_risk_score?: number | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  is_automatic: boolean;
}

export interface GuestTag {
  id: string;
  guest_id: string;
  tag_id: string;
  assigned_by: string;
  assigned_at: string;
  tags: Tag;
}

export interface DuplicateGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  match_type: string;
}

export interface ColumnMapping {
  name: string;
  email: string;
  phone: string;
  opt_in_marketing: string;
  notes: string;
  import_visit_count: string;
  import_last_visit_date: string;
}

export interface CSVRow {
  [key: string]: string;
}
