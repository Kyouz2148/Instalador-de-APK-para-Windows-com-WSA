using System.Diagnostics;
using WSAInstaller.Models;
using Microsoft.Extensions.Logging;

namespace WSAInstaller.Services
{
    public interface IAdbService
    {
        Task<bool> IsAdbAvailableAsync();
        Task<bool> ConnectToWSAAsync();
        Task<bool> IsConnectedToWSAAsync();
        Task<List<InstalledApp>> GetInstalledAppsAsync();
        Task<ApkInstallResult> InstallApkAsync(string apkPath, bool forceInstall = false);
        Task<bool> UninstallAppAsync(string packageName);
        string? GetAdbPath();
    }

    public class AdbService : IAdbService
    {
        private readonly ILogger<AdbService> _logger;
        private string? _adbPath;

        public AdbService(ILogger<AdbService> logger)
        {
            _logger = logger;
            _adbPath = FindAdbPath();
        }

        public async Task<bool> IsAdbAvailableAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    _adbPath = FindAdbPath();
                }

                if (string.IsNullOrEmpty(_adbPath))
                {
                    return false;
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = "version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    await process.WaitForExitAsync();
                    return process.ExitCode == 0;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking ADB availability");
                return false;
            }
        }

        public async Task<bool> ConnectToWSAAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    return false;
                }

                _logger.LogInformation("Connecting to WSA via ADB...");

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = "connect 127.0.0.1:58526",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    var error = await process.StandardError.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    _logger.LogInformation($"ADB Connect Output: {output}");
                    if (!string.IsNullOrEmpty(error))
                    {
                        _logger.LogWarning($"ADB Connect Error: {error}");
                    }

                    return output.Contains("connected") || await IsConnectedToWSAAsync();
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting to WSA");
                return false;
            }
        }

        public async Task<bool> IsConnectedToWSAAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    return false;
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = "devices",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    return output.Contains("127.0.0.1:58526") && output.Contains("device");
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking ADB connection");
                return false;
            }
        }

        public async Task<List<InstalledApp>> GetInstalledAppsAsync()
        {
            var apps = new List<InstalledApp>();

            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    return apps;
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = "shell pm list packages -3",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in lines)
                    {
                        if (line.StartsWith("package:"))
                        {
                            var packageName = line.Substring(8).Trim();
                            if (!string.IsNullOrEmpty(packageName))
                            {
                                apps.Add(new InstalledApp
                                {
                                    PackageName = packageName,
                                    DisplayName = GetDisplayName(packageName)
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting installed apps");
            }

            return apps;
        }

        public async Task<ApkInstallResult> InstallApkAsync(string apkPath, bool forceInstall = false)
        {
            var result = new ApkInstallResult();

            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    result.ErrorMessage = "ADB not available";
                    return result;
                }

                if (!File.Exists(apkPath))
                {
                    result.ErrorMessage = "APK file not found";
                    return result;
                }

                _logger.LogInformation($"Installing APK: {apkPath}");

                var arguments = forceInstall ? $"install -r -d \"{apkPath}\"" : $"install \"{apkPath}\"";

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = arguments,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    var error = await process.StandardError.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    _logger.LogInformation($"Install Output: {output}");
                    if (!string.IsNullOrEmpty(error))
                    {
                        _logger.LogWarning($"Install Error: {error}");
                    }

                    if (output.Contains("Success"))
                    {
                        result.Success = true;
                        _logger.LogInformation("APK installed successfully");
                    }
                    else if (error.Contains("INSTALL_FAILED_VERSION_DOWNGRADE") && !forceInstall)
                    {
                        // Try force install for downgrades
                        return await InstallApkAsync(apkPath, true);
                    }
                    else
                    {
                        result.ErrorMessage = !string.IsNullOrEmpty(error) ? error : output;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error installing APK");
                result.ErrorMessage = ex.Message;
            }

            return result;
        }

        public async Task<bool> UninstallAppAsync(string packageName)
        {
            try
            {
                if (string.IsNullOrEmpty(_adbPath))
                {
                    return false;
                }

                _logger.LogInformation($"Uninstalling package: {packageName}");

                var startInfo = new ProcessStartInfo
                {
                    FileName = _adbPath,
                    Arguments = $"uninstall {packageName}",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    return output.Contains("Success");
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uninstalling app");
                return false;
            }
        }

        public string? GetAdbPath() => _adbPath;

        private string? FindAdbPath()
        {
            // Try common locations
            var possiblePaths = new[]
            {
                "adb.exe", // If in PATH
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), 
                    "Microsoft", "WinGet", "Packages", "Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe", 
                    "platform-tools", "adb.exe"),
                @"C:\platform-tools\adb.exe",
                @"C:\Android\platform-tools\adb.exe"
            };

            foreach (var path in possiblePaths)
            {
                try
                {
                    if (path == "adb.exe")
                    {
                        // Test if adb is in PATH
                        var startInfo = new ProcessStartInfo
                        {
                            FileName = "where",
                            Arguments = "adb",
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true
                        };

                        using var process = Process.Start(startInfo);
                        if (process != null)
                        {
                            var output = process.StandardOutput.ReadToEnd();
                            process.WaitForExit();
                            
                            if (process.ExitCode == 0 && !string.IsNullOrEmpty(output))
                            {
                                return output.Split('\n')[0].Trim();
                            }
                        }
                    }
                    else if (File.Exists(path))
                    {
                        return path;
                    }
                }
                catch
                {
                    // Continue to next path
                }
            }

            return null;
        }

        private string GetDisplayName(string packageName)
        {
            // Extract a display name from package name
            var parts = packageName.Split('.');
            if (parts.Length > 0)
            {
                var lastPart = parts.Last();
                return char.ToUpper(lastPart[0]) + lastPart.Substring(1);
            }
            return packageName;
        }
    }
}