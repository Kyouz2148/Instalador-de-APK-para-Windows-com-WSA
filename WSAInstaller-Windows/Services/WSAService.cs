using System.Diagnostics;
using WSAInstaller.Models;
using Microsoft.Extensions.Logging;

namespace WSAInstaller.Services
{
    public interface IWSAService
    {
        Task<WSAStatus> GetStatusAsync();
        Task<bool> StartWSAAsync();
        Task<bool> IsWSAInstalledAsync();
        Task<bool> IsWSARunningAsync();
    }

    public class WSAService : IWSAService
    {
        private readonly ILogger<WSAService> _logger;

        public WSAService(ILogger<WSAService> logger)
        {
            _logger = logger;
        }

        public async Task<WSAStatus> GetStatusAsync()
        {
            var status = new WSAStatus();

            try
            {
                status.IsInstalled = await IsWSAInstalledAsync();
                status.IsRunning = await IsWSARunningAsync();
                
                if (status.IsInstalled)
                {
                    status.Version = await GetWSAVersionAsync();
                }

                _logger.LogInformation($"WSA Status - Installed: {status.IsInstalled}, Running: {status.IsRunning}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting WSA status");
                status.ErrorMessage = ex.Message;
            }

            return status;
        }

        public async Task<bool> StartWSAAsync()
        {
            try
            {
                _logger.LogInformation("Starting WSA...");
                
                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-Command \"Start-Process 'shell:AppsFolder\\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App'\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    await process.WaitForExitAsync();
                    
                    // Wait a bit for WSA to initialize
                    await Task.Delay(3000);
                    
                    return process.ExitCode == 0;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting WSA");
                return false;
            }
        }

        public async Task<bool> IsWSAInstalledAsync()
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-Command \"Get-AppxPackage -Name 'MicrosoftCorporationII.WindowsSubsystemForAndroid'\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync();
                    
                    return !string.IsNullOrWhiteSpace(output) && output.Contains("MicrosoftCorporationII.WindowsSubsystemForAndroid");
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if WSA is installed");
                return false;
            }
        }

        public async Task<bool> IsWSARunningAsync()
        {
            try
            {
                var processes = Process.GetProcessesByName("WsaClient");
                return processes.Length > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if WSA is running");
                return false;
            }
        }

        private async Task<string?> GetWSAVersionAsync()
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-Command \"(Get-AppxPackage -Name 'MicrosoftCorporationII.WindowsSubsystemForAndroid').Version\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process != null)
                {
                    var output = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync();
                    
                    return output.Trim();
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting WSA version");
                return null;
            }
        }
    }
}