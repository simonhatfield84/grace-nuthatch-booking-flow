export interface SquareWebhookEvent {
  id: number;
  event_id: string;
  event_type: string;
  location_id: string | null;
  resource_id: string | null;
  signature_valid: boolean;
  payload: any;
  received_at: string;
  processed_at: string | null;
  status: 'pending' | 'processed' | 'failed';
  error: string | null;
}

export interface SquareEventQueue {
  id: number;
  webhook_event_id: number;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  last_error: string | null;
}

export interface SquareOrder {
  id: number;
  order_id: string;
  location_id: string | null;
  state: string | null;
  source: string | null;
  opened_at: string | null;
  closed_at: string | null;
  total_money: number | null;
  tip_money: number | null;
  discount_money: number | null;
  service_charge_money: number | null;
  taxes_money: number | null;
  version: number | null;
  customer_id: string | null;
  note: string | null;
  raw: any;
  updated_at: string;
}

export interface OrderLink {
  id: number;
  order_id: string;
  payment_id: string | null;
  visit_id: string | null;
  reservation_id: string | null;
  guest_id: string | null;
  link_method: string;
  confidence: number;
  created_at: string;
}

export interface OrderLinkReview {
  id: number;
  order_id: string | null;
  payment_id: string | null;
  proposed_visit_id: string | null;
  proposed_reservation_id: string | null;
  proposed_guest_id: string | null;
  reason: string;
  confidence: number;
  suggested_actions: any;
  snapshot: any;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
}
