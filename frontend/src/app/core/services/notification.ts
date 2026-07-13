import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  referenceId?: number;
  createdAt: string;
}

export interface NotificationPayload {
  unreadCount: number;
  items: NotificationItem[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<NotificationPayload> {
    return this.http.get<NotificationPayload>(`${this.baseUrl}/notifications`);
  }

  markRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.http.put<{ updated: number }>(`${this.baseUrl}/notifications/read-all`, {});
  }
}
