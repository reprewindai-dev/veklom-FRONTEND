import { GitCommit, Circle, ArrowDown } from "lucide-react";

export interface DecisionNode {
  id: string;
  label: string;
  status?: "pending" | "approved" | "rejected" | "bypassed";
  author?: string;
}

export function DecisionGraph({ nodes }: { nodes: DecisionNode[] }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved": return "text-cos-verified border-cos-verified bg-cos-verified/10";
      case "rejected": return "text-cos-danger border-cos-danger bg-cos-danger/10";
      case "bypassed": return "text-cos-warn border-cos-warn bg-cos-warn/10";
      default: return "text-cos-steel border-cos-border bg-cos-surface2";
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex flex-col">
          <div className={`flex items-center justify-between rounded border p-3 ${getStatusColor(node.status)}`}>
            <div className="flex items-center gap-3">
              {node.status === "approved" || node.status === "rejected" || node.status === "bypassed" ? (
                <GitCommit size={16} />
              ) : (
                <Circle size={16} />
              )}
              <span className="text-sm font-medium">{node.label}</span>
            </div>
            {node.author && (
              <span className="text-xs opacity-80">{node.author}</span>
            )}
          </div>
          {index < nodes.length - 1 && (
            <div className="my-1 flex justify-center text-cos-border">
              <ArrowDown size={16} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
