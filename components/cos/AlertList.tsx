import { AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface AlertItem {
  id: string;
  type: "info" | "warning" | "critical";
  message: string;
  time?: string;
}

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertCircle size={16} className="text-cos-danger flex-shrink-0" />;
      case "warning": return <AlertTriangle size={16} className="text-cos-warn flex-shrink-0" />;
      default: return <Info size={16} className="text-cos-accent flex-shrink-0" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "critical": return "bg-cos-danger/5 border-cos-danger/20";
      case "warning": return "bg-cos-warn/5 border-cos-warn/20";
      default: return "bg-cos-accent/5 border-cos-accent/20";
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {alerts.map((alert) => (
        <div key={alert.id} className={`flex items-start gap-3 rounded border p-3 ${getBg(alert.type)}`}>
          {getIcon(alert.type)}
          <div className="flex flex-1 flex-col justify-center">
            <span className="text-sm text-cos-text">{alert.message}</span>
            {alert.time && <span className="mt-0.5 text-xs text-cos-muted">{alert.time}</span>}
          </div>
        </div>
      ))}
      {alerts.length === 0 && (
        <div className="flex items-center gap-2 rounded border border-cos-border border-dashed p-4 text-cos-muted">
          <Info size={16} />
          <span className="text-sm">No active alerts</span>
        </div>
      )}
    </div>
  );
}
