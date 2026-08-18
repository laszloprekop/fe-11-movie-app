import { request } from './client';
import type { DashboardDto } from './types';

export function getDashboard(): Promise<DashboardDto> {
  return request<DashboardDto>('/api/reports/dashboard');
}
