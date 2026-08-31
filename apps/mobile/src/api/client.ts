export const API_BASE_URL = 'http://87.58.204.138';
export const WS_BASE_URL = 'ws://87.58.204.138';

export interface ApiResponse<T = any> {
  data: T;
  meta?: {
    next_cursor?: string;
    has_more?: boolean;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

class MobileApiClient {
  private token: string | null =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNhYmQ1NzMtZmVlMi00MmZmLWFlZTUtNDBjYmM2N2VkYmUzIiwiZW1haWwiOiJhbGV4QHN5bmFwc2UuZGV2IiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc4ODEzNzk1MCwiaWF0IjoxNzg4MTM3MDUwfQ.izLViBbbP4fy8f1GVZyossxUznDr54_NKRtf0UMMo_0';
  private refreshToken: string | null =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNhYmQ1NzMtZmVlMi00MmZmLWFlZTUtNDBjYmM2N2VkYmUzIiwiZW1haWwiOiJhbGV4QHN5bmFwc2UuZGV2IiwidHlwZSI6InJlZnJlc2giLCJleHAiOjE3ODg2OTk1MjQsImlhdCI6MTc4ODA5NDcyNH0.LQZu2ivvVZIfq_2gFlyWlGcsUekhh364KFm1o5SzwVE';
  private baseUrl: string = API_BASE_URL;

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, ''); // strip trailing slash
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
  }

  public clearTokens() {
    this.token = null;
    this.refreshToken = null;
  }

  public getAccessToken(): string | null {
    return this.token;
  }

  /** Attempt silent token refresh using refresh_token, or re-login if refresh fails */
  private async tryRefresh(): Promise<boolean> {
    // 1. Try refresh token if available
    if (this.refreshToken) {
      try {
        const url = `${this.baseUrl}/api/auth/refresh`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
        if (res.ok) {
          const resData = await res.json();
          const token = resData?.data?.access_token || resData?.tokens?.access_token;
          if (token) {
            this.token = token;
            return true;
          }
        }
      } catch {
        // Refresh token failed, fall through to re-login
      }
    }

    // 2. Re-login with default credentials if token refresh failed
    try {
      const loginUrl = `${this.baseUrl}/api/auth/login`;
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'architect@synapse.local',
          password: 'password123',
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        const tokens = resData?.data?.tokens || resData?.tokens;
        if (tokens?.access_token) {
          this.setTokens(tokens.access_token, tokens.refresh_token);
          return true;
        }
      }
    } catch {
      // Re-login failed
    }

    return false;
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    _isRetry = false
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return { data: null as any };
      }

      // Auto-refresh token and retry on 401 (expired token)
      if (response.status === 401 && !_isRetry) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request<T>(endpoint, options, true);
        }
      }

      const resData = await response.json();

      if (!response.ok) {
        throw {
          code: resData.code || `HTTP_${response.status}`,
          message: resData.message || response.statusText,
          details: resData.details,
        } as ApiError;
      }

      return resData as ApiResponse<T>;
    } catch (error: any) {
      if (error.code) throw error;
      throw {
        code: 'NETWORK_ERROR',
        message: error.message || 'Сетевая ошибка подключения к серверу',
      } as ApiError;
    }
  }

  public get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const mobileApiClient = new MobileApiClient();
