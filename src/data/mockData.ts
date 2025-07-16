// Mock data for homepage demonstrations
export const mockBookings = [
  {
    id: 1,
    guest_name: "Sarah Johnson",
    party_size: 4,
    booking_time: "18:00",
    status: "confirmed",
    table_id: 12,
    notes: "Anniversary dinner",
    phone: "+1-555-0123"
  },
  {
    id: 2,
    guest_name: "Michael Chen",
    party_size: 2,
    booking_time: "18:30",
    status: "seated",
    table_id: 5,
    notes: "Allergies: nuts",
    phone: "+1-555-0456"
  },
  {
    id: 3,
    guest_name: "Emily Davis",
    party_size: 6,
    booking_time: "19:00",
    status: "confirmed",
    table_id: 8,
    notes: "Birthday celebration",
    phone: "+1-555-0789"
  },
  {
    id: 4,
    guest_name: "Walk-in: James Wilson",
    party_size: 3,
    booking_time: "19:15",
    status: "seated",
    table_id: 3,
    notes: "Walk-in guest",
    phone: "+1-555-0321"
  },
  {
    id: 5,
    guest_name: "Lisa Thompson",
    party_size: 2,
    booking_time: "19:30",
    status: "finished",
    table_id: 15,
    notes: "Regular customer",
    phone: "+1-555-0654"
  },
  {
    id: 6,
    guest_name: "David Martinez",
    party_size: 8,
    booking_time: "20:00",
    status: "confirmed",
    table_id: 20,
    notes: "Corporate dinner",
    phone: "+1-555-0987"
  }
];

export const mockTables = [
  { id: 1, label: "T1", seats: 2, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 1, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 2, label: "T2", seats: 2, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 2, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 3, label: "T3", seats: 4, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 3, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 5, label: "T5", seats: 4, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 4, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 8, label: "T8", seats: 6, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 5, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 12, label: "T12", seats: 4, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 6, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 15, label: "T15", seats: 2, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 7, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 20, label: "T20", seats: 8, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 8, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 21, label: "T21", seats: 6, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 9, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 22, label: "T22", seats: 4, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 10, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" }
];

export const mockSections = [
  { id: 1, name: "Main Dining", color: "#3B82F6", description: "Main dining area" },
  { id: 2, name: "Patio", color: "#10B981", description: "Outdoor seating" },
  { id: 3, name: "Private", color: "#8B5CF6", description: "Private dining rooms" }
];

export const mockKpis = {
  todayBookings: 24,
  weeklyBookings: 142,
  guestCount: 1247,
  revenue: 12850,
  availableTables: 8,
  unallocatedBookings: 3
};

// Enhanced mock data for more realistic host screen
export const mockHostBookings = [
  {
    id: 1,
    guest_name: "Sarah Johnson",
    party_size: 4,
    booking_time: "18:00",
    status: "confirmed",
    table_id: 1,
    notes: "Anniversary dinner",
    phone: "+44 20 7123 4567"
  },
  {
    id: 2,
    guest_name: "Michael Chen",
    party_size: 2,
    booking_time: "18:15",
    status: "seated",
    table_id: 3,
    notes: "Allergies: nuts",
    phone: "+44 20 7123 4568"
  },
  {
    id: 3,
    guest_name: "Emily Davis",
    party_size: 6,
    booking_time: "18:30",
    status: "confirmed",
    table_id: 8,
    notes: "Birthday celebration",
    phone: "+44 20 7123 4569"
  },
  {
    id: 4,
    guest_name: "Walk-in: James Wilson",
    party_size: 3,
    booking_time: "19:00",
    status: "seated",
    table_id: 12,
    notes: "Walk-in guest",
    phone: "+44 20 7123 4570"
  },
  {
    id: 5,
    guest_name: "Lisa Thompson",
    party_size: 2,
    booking_time: "19:15",
    status: "finished",
    table_id: 15,
    notes: "Regular customer",
    phone: "+44 20 7123 4571"
  },
  {
    id: 6,
    guest_name: "David Martinez",
    party_size: 8,
    booking_time: "19:30",
    status: "confirmed",
    table_id: 20,
    notes: "Corporate dinner",
    phone: "+44 20 7123 4572"
  },
  {
    id: 7,
    guest_name: "Rachel Green",
    party_size: 4,
    booking_time: "20:00",
    status: "confirmed",
    table_id: 21,
    notes: "Vegetarian menu",
    phone: "+44 20 7123 4573"
  },
  {
    id: 8,
    guest_name: "Tom Hardy",
    party_size: 2,
    booking_time: "20:30",
    status: "confirmed",
    table_id: 22,
    notes: "Quiet table requested",
    phone: "+44 20 7123 4574"
  }
];

// Enhanced mock tables with join groups and priorities
export const mockEnhancedTables = [
  { id: 1, label: "T1", seats: 2, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 1, position_x: 0, position_y: 0, join_groups: [1], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 2, label: "T2", seats: 2, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 2, position_x: 0, position_y: 0, join_groups: [1], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 3, label: "T3", seats: 4, section_id: 1, online_bookable: true, status: "active" as const, priority_rank: 3, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 5, label: "T5", seats: 4, section_id: 1, online_bookable: false, status: "active" as const, priority_rank: 4, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 8, label: "T8", seats: 6, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 1, position_x: 0, position_y: 0, join_groups: [2], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 12, label: "T12", seats: 4, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 2, position_x: 0, position_y: 0, join_groups: [2], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 15, label: "T15", seats: 2, section_id: 2, online_bookable: true, status: "active" as const, priority_rank: 3, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 20, label: "T20", seats: 8, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 1, position_x: 0, position_y: 0, join_groups: [], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 21, label: "T21", seats: 6, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 2, position_x: 0, position_y: 0, join_groups: [3], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" },
  { id: 22, label: "T22", seats: 4, section_id: 3, online_bookable: true, status: "active" as const, priority_rank: 3, position_x: 0, position_y: 0, join_groups: [3], deleted_at: null, created_at: null, updated_at: null, venue_id: "mock-venue" }
];

export const mockServicePopularity = {
  "Dinner": 45,
  "Afternoon Tea": 28,
  "Brunch": 18,
  "Private Event": 9
};

export const mockStatusBreakdown = {
  "confirmed": 12,
  "seated": 8,
  "finished": 4,
  "cancelled": 2
};

export const mockSecurityEvents = [
  {
    id: 1,
    event_type: "unauthorized_access_attempt",
    event_details: { ip: "192.168.1.100", user_agent: "Chrome/120.0" },
    created_at: "2024-01-15T14:30:00Z",
    ip_address: "192.168.1.100"
  },
  {
    id: 2,
    event_type: "role_change_successful",
    event_details: { target_user: "user123", old_role: "staff", new_role: "manager" },
    created_at: "2024-01-15T13:45:00Z",
    ip_address: "192.168.1.101"
  },
  {
    id: 3,
    event_type: "suspicious_login_pattern",
    event_details: { attempts: 5, duration: "2 minutes" },
    created_at: "2024-01-15T12:15:00Z",
    ip_address: "192.168.1.102"
  }
];

export const mockSecurityMetrics = {
  criticalEvents: 2,
  suspiciousEvents: 1,
  totalEvents: 24,
  activeAlerts: 0
};