
export interface SecurityEventDetails {
  severity?: string;
  reason?: string;
  target_user_id?: string;
  attempted_role?: string;
  blocked_at?: string;
  caller_role?: string;
  old_role?: string;
  new_role?: string;
  changed_by_role?: string;
  changed_at?: string;
  action_type?: string;
  [key: string]: any;
}

export const isEventDetailsObject = (value: any): value is SecurityEventDetails => {
  return value && typeof value === 'object' && !Array.isArray(value);
};
