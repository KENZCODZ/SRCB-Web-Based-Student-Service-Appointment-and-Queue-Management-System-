export type UserRole = 'admin' | 'staff' | 'student';

export interface User {
  id: number;
  student_id_number?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  contact_number?: string | null;
  department_or_course?: string | null;
  year_level?: string | null;
  is_active: number;
  last_login_at?: string | null;
  created_at?: string;
}

export type ServiceType = 'appointment' | 'queue';

export interface ServiceSchedule {
  id?: number;
  service_id?: number;
  day_of_week: number; // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string;
  end_time: string;
  slot_duration_mins: number;
  max_students_per_slot: number;
  is_active?: number;
}

export interface Service {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  category: string;
  service_type: ServiceType;
  location_or_counter?: string | null;
  estimated_duration_mins: number;
  max_daily_capacity: number;
  requirements?: string | null;
  is_active: number;
  created_at?: string;
  schedules?: ServiceSchedule[];
  active_schedules_count?: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  start_time_human: string;
  end_time_human: string;
  max_capacity: number;
  booked_count: number;
  available_capacity: number;
  is_available: boolean;
}

export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  appointment_code: string;
  user_id: number;
  service_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: AppointmentStatus;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  processed_by?: number | null;
  processed_at?: string | null;
  created_at: string;
  // Joins
  student_id_number?: string | null;
  first_name?: string;
  last_name?: string;
  student_email?: string;
  contact_number?: string | null;
  department_or_course?: string | null;
  year_level?: string | null;
  service_name?: string;
  service_code?: string;
  service_category?: string;
  location_or_counter?: string | null;
  requirements?: string | null;
  processor_first_name?: string | null;
  processor_last_name?: string | null;
}

export type QueueStatus = 'waiting' | 'calling' | 'serving' | 'completed' | 'skipped' | 'cancelled';

export interface QueueEntry {
  id: number;
  queue_number: string;
  user_id: number;
  service_id: number;
  queue_date: string;
  sequence_number: number;
  status: QueueStatus;
  counter_number?: string | null;
  called_by?: number | null;
  called_at?: string | null;
  served_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
  // Computed & Joins
  ahead_in_line?: number;
  estimated_wait_mins?: number;
  student_id_number?: string | null;
  first_name?: string;
  last_name?: string;
  student_email?: string;
  department_or_course?: string | null;
  year_level?: string | null;
  service_name?: string;
  service_code?: string;
  service_category?: string;
  location_or_counter?: string | null;
  estimated_duration_mins?: number;
  caller_first_name?: string | null;
  caller_last_name?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'appointment' | 'queue' | 'system';
  related_id?: number | null;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  details_json?: string | null;
  ip_address?: string | null;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface EmailLog {
  id: number;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  template: string;
  payload_json?: string | null;
  status: 'sent' | 'failed' | 'queued';
  error_message?: string | null;
  external_message_id?: string | null;
  created_at: string;
}

export interface DashboardStats {
  appointments?: {
    total_pending_appointments?: number;
    today_approved_appointments?: number;
    today_total_appointments?: number;
    today_completed_appointments?: number;
  };
  queues?: {
    currently_waiting?: number;
    currently_calling?: number;
    currently_serving?: number;
    today_completed?: number;
    today_skipped?: number;
    total_today_tickets?: number;
  };
  services?: {
    total_services?: number;
    active_appointment_services?: number;
    active_queue_services?: number;
  };
  users?: {
    total_students?: number;
    total_staff?: number;
  };
  trends_7days?: Array<{
    date: string;
    label: string;
    appointments: number;
    queues: number;
  }>;
  summary?: {
    pending_appointments: number;
    upcoming_appointments: number;
    completed_appointments: number;
    active_queue_tickets: number;
  };
  next_appointment?: Appointment | null;
  recent_appointments?: Appointment[];
  active_tickets?: QueueEntry[];
  live_queue_entries?: QueueEntry[];
  today_appointments_list?: Appointment[];
  counter_summaries?: Array<{
    service_id: number;
    service_name: string;
    service_code: string;
    service_category: string;
    location_or_counter: string;
    waiting_count: number;
    current_ticket: string | null;
    current_status: QueueStatus | null;
    counter_number: string | null;
  }>;
  recent_completed_today?: QueueEntry[];
  live_services?: Array<{
    id: number;
    name: string;
    code: string;
    category: string;
    location_or_counter: string;
    estimated_duration_mins: number;
    waiting_count: number;
    now_serving: string | null;
    estimated_wait_mins: number;
  }>;
  server_time?: string;
}
