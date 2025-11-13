interface CameraStatusProps {
  online: boolean;
  showLabel?: boolean;
}

export function CameraStatus({ online, showLabel = true }: CameraStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`h-2 w-2 rounded-full ${
            online ? "bg-status-online" : "bg-status-offline"
          }`}
        />
        {online && (
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-status-online animate-ping opacity-75" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {online ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
