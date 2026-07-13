import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  affiliation?: string;
}

export interface UpdateExpertiseRequest {
  expertise: string[];
}


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/me`);
  }

  updateCurrentUserProfile(payload: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/me`, payload);
  }

  updateCurrentUserExpertise(payload: UpdateExpertiseRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/users/me/expertise`, payload);
  }

  listUsers(role?: string, status?: string): Observable<UserResponse[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (status) params = params.set('status', status);
    return this.http.get<UserResponse[]>(`${this.baseUrl}/admin/users`, { params });
  }

  updateUserStatus(userId: number, status: string): Observable<UserResponse> {
    const params = new HttpParams().set('value', status);
    return this.http.patch<UserResponse>(`${this.baseUrl}/admin/users/${userId}/status`, null, { params });
  }

  updateUserRole(userId: number, role: string): Observable<UserResponse> {
    const params = new HttpParams().set('value', role);
    return this.http.patch<UserResponse>(`${this.baseUrl}/admin/users/${userId}/role`, null, { params });
  }

}
