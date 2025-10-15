using WSAInstaller.Models;
using Microsoft.Extensions.Logging;

namespace WSAInstaller.Services
{
    public interface IApkService
    {
        bool IsValidApkFile(string filePath);
        Task<string?> GetApkPackageNameAsync(string filePath);
        Task<string?> GetApkDisplayNameAsync(string filePath);
        string GetTempApkPath(string originalFileName);
        void CleanupTempFiles();
    }

    public class ApkService : IApkService
    {
        private readonly ILogger<ApkService> _logger;
        private readonly string _tempDirectory;

        public ApkService(ILogger<ApkService> logger)
        {
            _logger = logger;
            _tempDirectory = Path.Combine(Path.GetTempPath(), "WSAInstaller");
            
            // Create temp directory if it doesn't exist
            if (!Directory.Exists(_tempDirectory))
            {
                Directory.CreateDirectory(_tempDirectory);
            }
        }

        public bool IsValidApkFile(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    return false;
                }

                // Check file extension
                if (!filePath.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                // Check file size (should be > 0 and < 2GB)
                var fileInfo = new FileInfo(filePath);
                if (fileInfo.Length == 0 || fileInfo.Length > 2L * 1024 * 1024 * 1024)
                {
                    return false;
                }

                // Basic APK validation - check for ZIP signature
                using var stream = File.OpenRead(filePath);
                var buffer = new byte[4];
                stream.Read(buffer, 0, 4);
                
                // APK files are ZIP files, so they should start with PK signature
                return buffer[0] == 0x50 && buffer[1] == 0x4B;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating APK file: {filePath}");
                return false;
            }
        }

        public async Task<string?> GetApkPackageNameAsync(string filePath)
        {
            try
            {
                // This would require parsing the APK's AndroidManifest.xml
                // For now, we'll return null and let the install process handle it
                // A proper implementation would use AAPT or parse the binary XML
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting package name from APK: {filePath}");
                return null;
            }
        }

        public async Task<string?> GetApkDisplayNameAsync(string filePath)
        {
            try
            {
                // Extract display name from file name as fallback
                var fileName = Path.GetFileNameWithoutExtension(filePath);
                return fileName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting display name from APK: {filePath}");
                return null;
            }
        }

        public string GetTempApkPath(string originalFileName)
        {
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var fileName = $"{timestamp}_{Path.GetFileName(originalFileName)}";
            return Path.Combine(_tempDirectory, fileName);
        }

        public void CleanupTempFiles()
        {
            try
            {
                if (Directory.Exists(_tempDirectory))
                {
                    var files = Directory.GetFiles(_tempDirectory, "*.apk");
                    var cutoffTime = DateTime.Now.AddHours(-24); // Remove files older than 24 hours

                    foreach (var file in files)
                    {
                        var fileInfo = new FileInfo(file);
                        if (fileInfo.CreationTime < cutoffTime)
                        {
                            try
                            {
                                File.Delete(file);
                                _logger.LogInformation($"Cleaned up temp file: {file}");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, $"Failed to delete temp file: {file}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during temp file cleanup");
            }
        }
    }
}