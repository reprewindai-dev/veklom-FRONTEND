/**
 * GPC Pipeline System — TypeScript Schema Mirrors
 * Auto-generated from Python Pydantic schemas
 * 
 * Generated for: veklom-control-plane/types/gpc.ts
 */

export enum PortType {
  PANDAS_DF = "pandas_df",
  DUCKDB_REL = "duckdb_rel",
  DOCUMENTS = "documents",
  SCALAR = "scalar",
  ANY = "any",
}

export interface NodePort {
  id: string;
  port_type: PortType;
  label: string;
  required?: boolean;
}

export interface GPCNode {
  id: string;
  node_type: string;
  label?: string;
  config: Record<string, any>;
  input_ports?: NodePort[];
  output_ports?: NodePort[];
  position?: { x: number; y: number };
  selected?: boolean;
  hidden?: boolean;
  last_updated?: number;
  last_executed?: number;
}

export interface GPCEdge {
  id: string;
  source_node_id: string;
  source_port_id: string;
  target_node_id: string;
  target_port_id: string;
}

export interface GPCPipelineGraph {
  pipeline_id: string;
  tenant_id: string;
  nodes: GPCNode[];
  edges: GPCEdge[];
  name?: string;
  description?: string;
  schema_version?: string;
  prompt_version?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  data_residency_region?: "ca-central-1" | "ca-west-1" | "on-premise";
}

export interface PipelineCompilationRequest {
  pipeline_id: string;
  tenant_id: string;
  target_node_id?: string;
}

export interface PipelineCompilationResult {
  success: boolean;
  python_code: string;
  node_count: number;
  execution_order: string[];
  parallel_levels: string[][];
  compilation_timestamp?: string;
  warnings?: string[];
}

export interface NLToGraphRequest {
  tenant_id: string;
  user_intent: string;
  available_components?: string[];
  data_residency_region?: "ca-central-1" | "ca-west-1" | "on-premise";
}

export interface NLToGraphResult {
  success: boolean;
  pipeline_graph?: GPCPipelineGraph;
  reasoning: string;
  retry_count?: number;
  confidence_score?: number;
  errors?: string[];
}

export interface PipelineExecutionTrace {
  trace_id: string;
  tenant_id: string;
  pipeline_id: string;
  user_id: string;
  execution_status: "running" | "success" | "failure" | "partial";
  node_id?: string;
  node_index?: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  data_residency_region?: "ca-central-1" | "ca-west-1" | "on-premise";
  rows_processed?: number;
  tokens_consumed?: number;
  schema_version?: string;
  prompt_version?: string;
  error_details?: string;
  compliance_checks?: Record<string, boolean>;
}

export interface GPCComponentDefinition {
  node_type: string;
  display_name: string;
  description?: string;
  category: "input" | "transform" | "output" | "ai" | "custom";
  icon?: string;
  form_schema?: any[];
  input_ports?: NodePort[];
  output_ports?: NodePort[];
  code_generator_class?: string;
  required_imports?: string[];
  tenant_id?: string;
}

export interface CanvasViewportState {
  zoom: number;
  pan_x: number;
  pan_y: number;
  selected_node_ids: Set<string>;
}

export interface PipelineExportPackage {
  version: string;
  pipeline: GPCPipelineGraph;
  components: GPCComponentDefinition[];
  exported_at: string;
  exported_by: string;
}

// Utility types for canvas interaction
export interface NodeExecutionState {
  node_id: string;
  status: "idle" | "running" | "success" | "failure";
  progress?: number;
  error?: string;
}

export interface PreviewData {
  node_id: string;
  rows: number;
  columns: string[];
  sample: any[][];
  timestamp: number;
}

export interface ExecutionEvent {
  event: "start" | "node_start" | "node_complete" | "complete" | "error";
  node_id?: string;
  index?: number;
  preview?: PreviewData;
  success?: boolean;
  message?: string;
  error?: string;
}
