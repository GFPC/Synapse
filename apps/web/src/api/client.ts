export const API_BASE_URL = 'http://localhost:3000';
export const WS_BASE_URL = 'ws://localhost:3000';

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

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.token = localStorage.getItem('synapse_access_token');
    this.refreshToken = localStorage.getItem('synapse_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
    localStorage.setItem('synapse_access_token', access);
    localStorage.setItem('synapse_refresh_token', refresh);
  }

  public clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('synapse_access_token');
    localStorage.removeItem('synapse_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.token || localStorage.getItem('synapse_access_token');
  }

  public getRefreshToken(): string | null {
    return this.refreshToken || localStorage.getItem('synapse_refresh_token');
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - Try to refresh token
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newAccessToken = refreshData.data.access_token;
                this.token = newAccessToken;
                localStorage.setItem('synapse_access_token', newAccessToken);
                this.isRefreshing = false;
                this.onTokenRefreshed(newAccessToken);

                // Retry original request
                headers.set('Authorization', `Bearer ${newAccessToken}`);
                const retryRes = await fetch(url, { ...options, headers });
                return await retryRes.json();
              } else {
                this.clearTokens();
                this.isRefreshing = false;
              }
            } catch (err) {
              this.clearTokens();
              this.isRefreshing = false;
            }
          } else {
            // Wait for refresh to complete
            return new Promise((resolve, reject) => {
              this.addRefreshSubscriber(async (newToken) => {
                headers.set('Authorization', `Bearer ${newToken}`);
                try {
                  const retryRes = await fetch(url, { ...options, headers });
                  const data = await retryRes.json();
                  resolve(data);
                } catch (e) {
                  reject(e);
                }
              });
            });
          }
        }
      }

      if (response.status === 204) {
        return { data: null as any };
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
        message: error.message || 'Network connection failed',
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

export const apiClient = new ApiClient();
