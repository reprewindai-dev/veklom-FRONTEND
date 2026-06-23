export interface RegionMetric {
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  uptime: number;
  throughput: number;
}

export interface ApiState {
  id: string;
  name: string;
  endpoint: string;
  version: string;
  compositeScore: number;
  x402Ready: boolean;
  stabilityRating: string;
  regions: {
    "us-east": RegionMetric;
    "us-west": RegionMetric;
    "eu-west": RegionMetric;
    "ap-southeast": RegionMetric;
    "ap-northeast": RegionMetric;
  };
}

export interface AlertConfig {
  id: string;
  metric: string;
  threshold: number;
  enabled: boolean;
  email: string;
  sms: string;
}

export interface AlertLog {
  id: string;
  timestamp: string;
  apiName: string;
  region: string;
  message: string;
  channel: string;
}

export interface AuditLog {
  timestamp: string;
  tenant: string;
  actor: string;
  action: string;
  entity: string;
  transaction: string;
}

export enum UserRole {
  ADMIN = "System Administrator",
  OPERATOR = "Node Operator",
  COMPLIANCE_AUDITOR = "Compliance Auditor",
  VISITOR_DEV = "Guest Developer"
}

export interface TenantInfo {
  id: string;
  name: string;
  role: UserRole;
  domain: string;
}
