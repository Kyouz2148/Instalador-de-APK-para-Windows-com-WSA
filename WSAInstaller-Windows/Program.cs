using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WSAInstaller.Services;
using WSAInstaller.Forms;

namespace WSAInstaller
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            // Configure services
            var services = new ServiceCollection();
            ConfigureServices(services);
            var serviceProvider = services.BuildServiceProvider();

            // To customize application configuration such as set high DPI settings or default font,
            // see https://aka.ms/applicationconfiguration.
            ApplicationConfiguration.Initialize();

            // Start the main form
            var mainForm = serviceProvider.GetRequiredService<MainForm>();
            Application.Run(mainForm);
        }

        private static void ConfigureServices(IServiceCollection services)
        {
            // Logging
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });

            // Services
            services.AddSingleton<IWSAService, WSAService>();
            services.AddSingleton<IAdbService, AdbService>();
            services.AddSingleton<IApkService, ApkService>();

            // Forms
            services.AddTransient<MainForm>();
        }
    }
}