import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

export type UserRole = 'USER' | 'ADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  unioCoins?: number;
  role: UserRole;
};

export type RequestOtpPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type UpdateProfilePayload = {
  email?: string;
  name?: string;
  phone?: string;
};

export type UpdatePasswordPayload = {
  confirmNewPassword: string;
  currentPassword: string;
  newPassword: string;
};

export type OrderUtilityMode = 'LANDLORD' | 'RENTEE';

export type OrderUtilityItem = {
  id: string;
  status: string;
  subtitle: string;
  title: string;
  updatedAt: string;
};

export type OrderUtilitySection = {
  items: OrderUtilityItem[];
  key: 'enquiries' | 'history' | 'requests';
  title: string;
};

type AuthResponse = {
  message: string;
  databaseWarning?: string;
  accessToken: string;
  user: AuthUser;
};

type AuthProfileResponse = {
  user: AuthUser;
};

type UpdateProfileResponse = {
  message: string;
  user: AuthUser | null;
};

type MobileAppMetaResponse = {
  installUrl: string;
};

export type OrderUtilitiesResponse = {
  mode: OrderUtilityMode;
  sections: OrderUtilitySection[];
};

export type UserDashboardResponse = {
  message: string;
  user: AuthUser;
};

export type AdminDashboardResponse = {
  message: string;
  user: AuthUser;
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalProperties?: number;
    pendingProperties?: number;
    confirmedBookings?: number;
    paidRevenue?: number;
  };
};

export type DashboardResponse = UserDashboardResponse | AdminDashboardResponse;

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'unio_access_token';
  private readonly userKey = 'unio_auth_user';
  private readonly apiBase = '/api/auth';
  private readonly currentUserSignal = signal<AuthUser | null>(this.readUserFromStorage());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(
    () => Boolean(this.currentUserSignal() && this.getAccessToken())
  );

  requestRegistrationOtp(payload: RequestOtpPayload): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(
      `${this.apiBase}/register/request-otp`,
      payload
    );
  }

  verifyRegistrationOtp(payload: VerifyOtpPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/register/verify-otp`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  loginUser(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/login`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  loginAdmin(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/admin-login`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.loginUser(payload);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  syncProfile(): Observable<AuthUser | null> {
    const token = this.getAccessToken();
    if (!token) {
      this.currentUserSignal.set(null);
      return of(null);
    }

    return this.http.get<AuthProfileResponse>(`${this.apiBase}/me`, { headers: this.getAuthHeaders() }).pipe(
      map((response) => response.user),
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUserSignal.set(user);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.logout();
          return of(null);
        }

        const cachedUser = this.readUserFromStorage();
        if (cachedUser && token) {
          this.currentUserSignal.set(cachedUser);
          return of(cachedUser);
        }

        return of(null);
      })
    );
  }

  getDashboardData(): Observable<DashboardResponse> {
    const role = this.currentUserSignal()?.role;
    const endpoint = role === 'ADMIN' ? '/api/admin/dashboard' : '/api/user/dashboard';
    return this.http.get<DashboardResponse>(endpoint, { headers: this.getAuthHeaders() });
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    return this.http
      .patch<UpdateProfileResponse>('/api/user/profile', payload, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        tap((response) => {
          if (response.user) {
            this.persistUser(response.user);
          }
        })
      );
  }

  updatePassword(payload: UpdatePasswordPayload): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>('/api/user/password', payload, {
      headers: this.getAuthHeaders()
    });
  }

  getOrderUtilities(mode: OrderUtilityMode): Observable<OrderUtilitiesResponse> {
    return this.http.get<OrderUtilitiesResponse>(`/api/user/orders?mode=${mode}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMobileAppInstallUrl(): Observable<string> {
    return this.http.get<MobileAppMetaResponse>('/api/meta/mobile-app').pipe(
      map((response) => response.installUrl),
      catchError(() =>
        of('https://play.google.com/store/apps/details?id=com.unio.mobile')
      )
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSignal.set(null);
  }

  private setSession(response: AuthResponse): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.setItem(this.tokenKey, response.accessToken);
    sessionStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  private persistUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private readUserFromStorage(): AuthUser | null {
    const rawUser = sessionStorage.getItem(this.userKey) || localStorage.getItem(this.userKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      sessionStorage.removeItem(this.userKey);
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
