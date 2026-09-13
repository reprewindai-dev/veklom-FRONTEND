export interface GpcPlanNode {
  id: string;
  type: string;
  description?: string;
  policy_tag?: string;
  entropy?: number;
}

export interface GpcPlanEdge {
  from: string;
  to: string;
}

export interface GpcCompileResponse {
  id: string;
  name?: string;
  intent?: string;
  graph?: {
    nodes: GpcPlanNode[];
    edges: GpcPlanEdge[];
  };
  status: string;
  proof_hash?: string;
  policy_result?: string;
  createdAt?: string;
  [key: string]: unknown;
}
