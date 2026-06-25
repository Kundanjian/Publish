import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthApiService } from './auth-api.service';

export type EnquiryPayload = {
  propertyId: string;
  enquiryType: string;
  message: string;
  preferredContact: string;
  moveInDate?: string;
  duration?: string;
  budget?: string;
};

export type Enquiry = {
  id: string;
  propertyId: string;
  enquiryType: string;
  message: string;
  preferredContact: string;
  moveInDate: string | null;
  duration: string | null;
  budget: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class EnquiryApiService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly base = '/api/enquiries';

  createEnquiry(payload: EnquiryPayload): Observable<{ message: string; enquiryId: string }> {
    return this.http.post<{ message: string; enquiryId: string }>(this.base, payload, {
      headers: this.authApi.getAuthHeaders()
    });
  }

  getMyEnquiries(): Observable<Enquiry[]> {
    return this.http.get<Enquiry[]>(this.base, { headers: this.authApi.getAuthHeaders() });
  }

  // Admin only
  getAllEnquiries(): Observable<Enquiry[]> {
    return this.http.get<Enquiry[]>(this.base, { headers: this.authApi.getAuthHeaders() });
  }

  approveEnquiry(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${id}/approve`, {}, {
      headers: this.authApi.getAuthHeaders()
    });
  }

  rejectEnquiry(id: string, reason?: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${id}/reject`, { reason }, {
      headers: this.authApi.getAuthHeaders()
    });
  }
}
