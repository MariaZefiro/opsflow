export type User = {
  id: string;
  email: string;
  role: string;
  companyId: string;
  companySlug: string;
};
export type Tab = 'overview' | 'tickets' | 'services' | 'incidents';

export type Ticket = {
  id: string;
  title: string;
  category: string;
  status: string;
};

export type ServiceCheck = {
  checkedAt: string;
  success: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
};

export type MonitoredService = {
  id: string;
  name: string;
  url: string;
  type: string;
  expectedStatus: number;
  checks?: ServiceCheck[];
  _count?: { checks: number; incidents: number };
};

export type Incident = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  status: string;
  severity: string;
  startedAt: string;
  durationSeconds: number | null;
  service?: { name: string; url: string; checks?: ServiceCheck[] } | null;
};

export type DashboardSummary = {
  tickets?: Array<{ status: string; _count: number }>;
  openIncidents?: number;
  activeServices?: number;
  uptime24h?: number;
};

export type WorkspaceData = {
  summary?: DashboardSummary;
  tickets?: Ticket[];
  services?: MonitoredService[];
  incidents?: Incident[];
};
