import { FileCode, FileJson, FileText, Download } from "lucide-react";

export interface MatrixFile {
  name: string;
  type: "json" | "code" | "text" | "pdf" | "log";
  size?: string;
  url?: string;
}

export function FileMatrix({ files }: { files: MatrixFile[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "json": return <FileJson size={16} className="text-cos-warn" />;
      case "code": return <FileCode size={16} className="text-cos-accent" />;
      default: return <FileText size={16} className="text-cos-steel" />;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {files.map((file, i) => (
        <div key={i} className="group flex items-center justify-between rounded border border-cos-border bg-cos-surface2 p-3 transition hover:border-cos-accent/50 hover:bg-cos-surface">
          <div className="flex min-w-0 items-center gap-3">
            {getIcon(file.type)}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium text-cos-text transition-colors group-hover:text-cos-accent">{file.name}</span>
              {file.size && <span className="text-[10px] text-cos-muted">{file.size}</span>}
            </div>
          </div>
          {file.url && (
            <a href={file.url} className="ml-2 flex-shrink-0 text-cos-steel transition-colors hover:text-cos-accent" title="Download">
              <Download size={14} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
