namespace WSAInstaller.Models
{
    public class WSAStatus
    {
        public bool IsInstalled { get; set; }
        public bool IsRunning { get; set; }
        public bool IsAdbConnected { get; set; }
        public string? Version { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ApkInstallResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? PackageName { get; set; }
    }

    public class InstalledApp
    {
        public string PackageName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Version { get; set; }
        public DateTime? InstallDate { get; set; }
    }

    public enum LogLevel
    {
        Info,
        Warning,
        Error,
        Success
    }

    public class LogEntry
    {
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public LogLevel Level { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}