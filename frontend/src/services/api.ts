const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('eduqueue_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(
            response.status === 500
              ? 'Backend API server error (500). Please verify that the PHP backend server is running on http://localhost:8000 and connected to MySQL.'
              : `Server returned error (${response.status}): ${text.substring(0, 100)}`
          );
        }
        try {
          data = JSON.parse(text);
        } catch {
          data = { success: true, message: text, data: text };
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('eduqueue_token');
          localStorage.removeItem('eduqueue_user');
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/public')) {
            window.location.href = '/login?expired=1';
          }
        }
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      throw error;
    }
  }

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: { email?: string; student_id_number?: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: any) {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('eduqueue_token');
      localStorage.removeItem('eduqueue_user');
    }
  }

  // -------------------------------------------------------------
  // SERVICES
  // -------------------------------------------------------------
  async getServices(params?: { type?: string; category?: string; all?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.all) searchParams.append('all', 'true');
    const qs = searchParams.toString();
    return this.request(`/services${qs ? `?${qs}` : ''}`);
  }

  async getPublicServices() {
    return this.request('/public/services');
  }

  async getServiceById(id: number) {
    return this.request(`/services/${id}`);
  }

  async createService(serviceData: any) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: number, serviceData: any) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async toggleServiceActive(id: number, isActive: boolean) {
    return this.request(`/services/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async getAvailableSlots(serviceId: number, date: string) {
    return this.request(`/services/${serviceId}/slots?date=${encodeURIComponent(date)}`);
  }

  // -------------------------------------------------------------
  // APPOINTMENTS
  // -------------------------------------------------------------
  async getAppointments(filters?: { status?: string; service_id?: number; date?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.service_id) searchParams.append('service_id', filters.service_id.toString());
    if (filters?.date) searchParams.append('date', filters.date);
    if (filters?.search) searchParams.append('search', filters.search);
    const qs = searchParams.toString();
    return this.request(`/appointments${qs ? `?${qs}` : ''}`);
  }

  async getAppointmentById(id: number) {
    return this.request(`/appointments/${id}`);
  }

  async bookAppointment(data: { service_id: number; appointment_date: string; start_time: string; end_time: string; purpose: string }) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: number, data: { status: string; admin_notes?: string; rejection_reason?: string; appointment_date?: string; start_time?: string; end_time?: string }) {
    return this.request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(id: number) {
    return this.request(`/appointments/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // -------------------------------------------------------------
  // QUEUE
  // -------------------------------------------------------------
  async joinQueue(serviceId: number) {
    return this.request('/queue/join', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId }),
    });
  }

  async getMyActiveTickets() {
    return this.request('/queue/my-active');
  }

  async getActiveQueueForService(serviceId: number, date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/queue/service/${serviceId}${qs}`);
  }

  async callNextTicket(serviceId: number, counterNumber: string) {
    return this.request(`/queue/service/${serviceId}/call-next`, {
      method: 'POST',
      body: JSON.stringify({ counter_number: counterNumber }),
    });
  }

  async updateQueueStatus(queueId: number, data: { status: string; counter_number?: string; notes?: string }) {
    return this.request(`/queue/${queueId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPublicDisplay() {
    return this.request('/public/queue/display');
  }

  // -------------------------------------------------------------
  // DASHBOARD & ANALYTICS
  // -------------------------------------------------------------
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: number) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // -------------------------------------------------------------
  // USERS (Admin)
  // -------------------------------------------------------------
  async getUsers(params?: { role?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return this.request(`/users${qs ? `?${qs}` : ''}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserActive(userId: number, isActive: boolean) {
    return this.request(`/users/${userId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // -------------------------------------------------------------
  // AUDIT LOGS & EMAIL LOGS (Admin)
  // -------------------------------------------------------------
  async getAuditLogs(params?: { action?: string; search?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.append('action', params.action);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const qs = searchParams.toString();
    return this.request(`/audit-logs${qs ? `?${qs}` : ''}`);
  }

  async getEmailLogs(limit: number = 50) {
    return this.request(`/audit-logs/emails?limit=${limit}`);
  }
}

export const api = new ApiService();
