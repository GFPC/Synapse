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
  private token: string | null = null;
  private refreshToken: string | null = null;

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

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
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
