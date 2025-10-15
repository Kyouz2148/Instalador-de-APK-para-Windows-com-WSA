using WSAInstaller.Models;
using WSAInstaller.Services;
using Microsoft.Extensions.Logging;

namespace WSAInstaller.Forms
{
    public partial class MainForm : Form
    {
        private readonly ILogger<MainForm> _logger;
        private readonly IWSAService _wsaService;
        private readonly IAdbService _adbService;
        private readonly IApkService _apkService;
        private readonly List<LogEntry> _logEntries = new();

        // UI Controls
        private Label _statusLabel;
        private Button _startWSAButton;
        private Button _connectADBButton;
        private Button _refreshButton;
        private Button _selectApkButton;
        private ListBox _appsListBox;
        private RichTextBox _logTextBox;
        private ProgressBar _progressBar;
        private Label _progressLabel;
        private Panel _statusPanel;
        private Panel _apkPanel;
        private Panel _appsPanel;
        private Panel _logPanel;

        public MainForm(ILogger<MainForm> logger, IWSAService wsaService, IAdbService adbService, IApkService apkService)
        {
            _logger = logger;
            _wsaService = wsaService;
            _adbService = adbService;
            _apkService = apkService;
            
            InitializeComponent();
            SetupEventHandlers();
            
            // Start initial status check
            _ = Task.Run(UpdateStatusAsync);
        }

        private void InitializeComponent()
        {
            this.Text = "WSA APK Installer";
            this.Size = new Size(800, 600);
            this.MinimumSize = new Size(600, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Icon = LoadIcon();

            // Create main layout
            var mainPanel = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                Padding = new Padding(10)
            };

            // Set row styles
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 120)); // Status
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 100)); // APK Install
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 50));   // Apps List
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 50));   // Logs

            // Create panels
            CreateStatusPanel();
            CreateApkPanel();
            CreateAppsPanel();
            CreateLogPanel();

            // Add panels to main layout
            mainPanel.Controls.Add(_statusPanel, 0, 0);
            mainPanel.Controls.Add(_apkPanel, 0, 1);
            mainPanel.Controls.Add(_appsPanel, 0, 2);
            mainPanel.Controls.Add(_logPanel, 0, 3);

            this.Controls.Add(mainPanel);

            // Enable drag and drop
            this.AllowDrop = true;
        }

        private void CreateStatusPanel()
        {
            _statusPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BorderStyle = BorderStyle.FixedSingle
            };

            var titleLabel = new Label
            {
                Text = "📱 WSA APK Installer",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(58, 89, 152),
                Location = new Point(10, 10),
                AutoSize = true
            };

            _statusLabel = new Label
            {
                Text = "Verificando status...",
                Location = new Point(10, 45),
                AutoSize = true
            };

            var buttonPanel = new FlowLayoutPanel
            {
                Location = new Point(10, 70),
                Size = new Size(500, 35),
                FlowDirection = FlowDirection.LeftToRight
            };

            _startWSAButton = new Button
            {
                Text = "▶️ Iniciar WSA",
                Size = new Size(100, 30),
                UseVisualStyleBackColor = true
            };

            _connectADBButton = new Button
            {
                Text = "🔗 Conectar ADB",
                Size = new Size(120, 30),
                UseVisualStyleBackColor = true
            };

            _refreshButton = new Button
            {
                Text = "🔄 Atualizar",
                Size = new Size(100, 30),
                UseVisualStyleBackColor = true
            };

            buttonPanel.Controls.AddRange(new Control[] { _startWSAButton, _connectADBButton, _refreshButton });

            _statusPanel.Controls.AddRange(new Control[] { titleLabel, _statusLabel, buttonPanel });
        }

        private void CreateApkPanel()
        {
            _apkPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BorderStyle = BorderStyle.FixedSingle
            };

            var titleLabel = new Label
            {
                Text = "📦 Instalar APK",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                Location = new Point(10, 10),
                AutoSize = true
            };

            _selectApkButton = new Button
            {
                Text = "📁 Selecionar arquivo APK...",
                Location = new Point(10, 40),
                Size = new Size(200, 30),
                UseVisualStyleBackColor = true
            };

            _progressBar = new ProgressBar
            {
                Location = new Point(220, 40),
                Size = new Size(200, 20),
                Visible = false
            };

            _progressLabel = new Label
            {
                Location = new Point(220, 65),
                Size = new Size(200, 20),
                Text = "",
                Visible = false
            };

            var dragLabel = new Label
            {
                Text = "Ou arraste um arquivo APK aqui",
                Location = new Point(430, 45),
                AutoSize = true,
                ForeColor = Color.Gray
            };

            _apkPanel.Controls.AddRange(new Control[] { titleLabel, _selectApkButton, _progressBar, _progressLabel, dragLabel });
        }

        private void CreateAppsPanel()
        {
            _appsPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BorderStyle = BorderStyle.FixedSingle
            };

            var titleLabel = new Label
            {
                Text = "📱 Aplicativos Instalados",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                Location = new Point(10, 10),
                AutoSize = true
            };

            _appsListBox = new ListBox
            {
                Location = new Point(10, 40),
                Size = new Size(760, 120),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom
            };

            var refreshAppsButton = new Button
            {
                Text = "🔄 Atualizar Lista",
                Location = new Point(10, 170),
                Size = new Size(120, 30),
                Anchor = AnchorStyles.Bottom | AnchorStyles.Left,
                UseVisualStyleBackColor = true
            };

            var uninstallButton = new Button
            {
                Text = "🗑️ Desinstalar",
                Location = new Point(140, 170),
                Size = new Size(100, 30),
                Anchor = AnchorStyles.Bottom | AnchorStyles.Left,
                UseVisualStyleBackColor = true,
                Enabled = false
            };

            // Enable/disable uninstall button based on selection
            _appsListBox.SelectedIndexChanged += (s, e) => {
                uninstallButton.Enabled = _appsListBox.SelectedItem != null;
            };

            refreshAppsButton.Click += async (s, e) => await LoadInstalledAppsAsync();
            uninstallButton.Click += async (s, e) => await UninstallSelectedAppAsync();

            _appsPanel.Controls.AddRange(new Control[] { titleLabel, _appsListBox, refreshAppsButton, uninstallButton });
        }

        private void CreateLogPanel()
        {
            _logPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BorderStyle = BorderStyle.FixedSingle
            };

            var titleLabel = new Label
            {
                Text = "📋 Logs",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                Location = new Point(10, 10),
                AutoSize = true
            };

            _logTextBox = new RichTextBox
            {
                Location = new Point(10, 40),
                Size = new Size(760, 120),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom,
                ReadOnly = true,
                BackColor = Color.Black,
                ForeColor = Color.White,
                Font = new Font("Consolas", 9)
            };

            var clearLogsButton = new Button
            {
                Text = "🗑️ Limpar Logs",
                Location = new Point(10, 170),
                Size = new Size(100, 30),
                Anchor = AnchorStyles.Bottom | AnchorStyles.Left,
                UseVisualStyleBackColor = true
            };

            clearLogsButton.Click += (s, e) => {
                _logEntries.Clear();
                _logTextBox.Clear();
                AddLog("Logs limpos", LogLevel.Info);
            };

            _logPanel.Controls.AddRange(new Control[] { titleLabel, _logTextBox, clearLogsButton });
        }

        private void SetupEventHandlers()
        {
            _startWSAButton.Click += async (s, e) => await StartWSAAsync();
            _connectADBButton.Click += async (s, e) => await ConnectADBAsync();
            _refreshButton.Click += async (s, e) => await UpdateStatusAsync();
            _selectApkButton.Click += SelectApkFile;

            // Drag and drop
            this.DragEnter += MainForm_DragEnter;
            this.DragDrop += MainForm_DragDrop;

            // Form events
            this.FormClosing += MainForm_FormClosing;
        }

        private Icon? LoadIcon()
        {
            try
            {
                // Try to load icon from resources
                var iconPath = Path.Combine(Application.StartupPath, "Resources", "icon.ico");
                if (File.Exists(iconPath))
                {
                    return new Icon(iconPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load application icon");
            }
            return null;
        }

        private async Task UpdateStatusAsync()
        {
            try
            {
                AddLog("Verificando status do sistema...", LogLevel.Info);
                
                var wsaStatus = await _wsaService.GetStatusAsync();
                var adbAvailable = await _adbService.IsAdbAvailableAsync();
                var adbConnected = await _adbService.IsConnectedToWSAAsync();

                this.Invoke(() =>
                {
                    var statusText = $"WSA: {(wsaStatus.IsInstalled ? "✅ Instalado" : "❌ Não instalado")} | " +
                                   $"ADB: {(adbAvailable ? "✅ Disponível" : "❌ Não encontrado")} | " +
                                   $"Conexão: {(adbConnected ? "✅ Conectado" : "❌ Desconectado")}";
                    
                    _statusLabel.Text = statusText;
                    _statusLabel.ForeColor = wsaStatus.IsInstalled && adbAvailable && adbConnected ? Color.Green : Color.Orange;

                    _startWSAButton.Enabled = wsaStatus.IsInstalled && !wsaStatus.IsRunning;
                    _connectADBButton.Enabled = adbAvailable && !adbConnected;
                });

                var statusMsg = $"Status atualizado - WSA: {(wsaStatus.IsInstalled ? "OK" : "Não instalado")}, ADB: {(adbAvailable ? "OK" : "Não encontrado")}";
                AddLog(statusMsg, wsaStatus.IsInstalled && adbAvailable ? LogLevel.Success : LogLevel.Warning);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status");
                AddLog($"Erro ao atualizar status: {ex.Message}", LogLevel.Error);
            }
        }

        private async Task StartWSAAsync()
        {
            try
            {
                AddLog("Iniciando WSA...", LogLevel.Info);
                _startWSAButton.Enabled = false;
                _startWSAButton.Text = "⏳ Iniciando...";

                var success = await _wsaService.StartWSAAsync();
                
                if (success)
                {
                    AddLog("WSA iniciado com sucesso", LogLevel.Success);
                    await Task.Delay(2000);
                    await UpdateStatusAsync();
                }
                else
                {
                    AddLog("Falha ao iniciar WSA", LogLevel.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting WSA");
                AddLog($"Erro ao iniciar WSA: {ex.Message}", LogLevel.Error);
            }
            finally
            {
                this.Invoke(() =>
                {
                    _startWSAButton.Text = "▶️ Iniciar WSA";
                    _startWSAButton.Enabled = true;
                });
            }
        }

        private async Task ConnectADBAsync()
        {
            try
            {
                AddLog("Conectando ADB ao WSA...", LogLevel.Info);
                _connectADBButton.Enabled = false;
                _connectADBButton.Text = "⏳ Conectando...";

                var success = await _adbService.ConnectToWSAAsync();
                
                if (success)
                {
                    AddLog("ADB conectado com sucesso", LogLevel.Success);
                    await UpdateStatusAsync();
                    await LoadInstalledAppsAsync();
                }
                else
                {
                    AddLog("Falha ao conectar ADB", LogLevel.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting ADB");
                AddLog($"Erro ao conectar ADB: {ex.Message}", LogLevel.Error);
            }
            finally
            {
                this.Invoke(() =>
                {
                    _connectADBButton.Text = "🔗 Conectar ADB";
                    _connectADBButton.Enabled = true;
                });
            }
        }

        private async Task LoadInstalledAppsAsync()
        {
            try
            {
                AddLog("Carregando aplicativos instalados...", LogLevel.Info);
                
                var apps = await _adbService.GetInstalledAppsAsync();
                
                this.Invoke(() =>
                {
                    _appsListBox.Items.Clear();
                    foreach (var app in apps)
                    {
                        _appsListBox.Items.Add($"{app.DisplayName} ({app.PackageName})");
                    }
                });

                AddLog($"{apps.Count} aplicativos carregados", LogLevel.Success);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading installed apps");
                AddLog($"Erro ao carregar aplicativos: {ex.Message}", LogLevel.Error);
            }
        }

        private async Task UninstallSelectedAppAsync()
        {
            try
            {
                if (_appsListBox.SelectedItem == null) return;

                var selectedText = _appsListBox.SelectedItem.ToString();
                var packageName = ExtractPackageName(selectedText);

                if (string.IsNullOrEmpty(packageName)) return;

                var result = MessageBox.Show(
                    $"Deseja realmente desinstalar o aplicativo?\n\nPacote: {packageName}",
                    "Confirmar Desinstalação",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);

                if (result != DialogResult.Yes) return;

                AddLog($"Desinstalando {packageName}...", LogLevel.Info);

                var success = await _adbService.UninstallAppAsync(packageName);

                if (success)
                {
                    AddLog($"Aplicativo {packageName} desinstalado com sucesso", LogLevel.Success);
                    await LoadInstalledAppsAsync();
                }
                else
                {
                    AddLog($"Falha ao desinstalar {packageName}", LogLevel.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uninstalling app");
                AddLog($"Erro ao desinstalar aplicativo: {ex.Message}", LogLevel.Error);
            }
        }

        private void SelectApkFile(object? sender, EventArgs e)
        {
            using var openFileDialog = new OpenFileDialog
            {
                Filter = "Arquivos APK (*.apk)|*.apk|Todos os arquivos (*.*)|*.*",
                Title = "Selecionar arquivo APK"
            };

            if (openFileDialog.ShowDialog() == DialogResult.OK)
            {
                _ = Task.Run(() => InstallApkAsync(openFileDialog.FileName));
            }
        }

        private void MainForm_DragEnter(object? sender, DragEventArgs e)
        {
            if (e.Data?.GetDataPresent(DataFormats.FileDrop) == true)
            {
                e.Effect = DragDropEffects.Copy;
            }
        }

        private void MainForm_DragDrop(object? sender, DragEventArgs e)
        {
            if (e.Data?.GetData(DataFormats.FileDrop) is string[] files && files.Length > 0)
            {
                var apkFiles = files.Where(f => f.EndsWith(".apk", StringComparison.OrdinalIgnoreCase)).ToArray();
                
                if (apkFiles.Length > 0)
                {
                    foreach (var apkFile in apkFiles)
                    {
                        _ = Task.Run(() => InstallApkAsync(apkFile));
                    }
                }
                else
                {
                    AddLog("Nenhum arquivo APK válido encontrado", LogLevel.Warning);
                }
            }
        }

        private async Task InstallApkAsync(string apkPath)
        {
            try
            {
                var fileName = Path.GetFileName(apkPath);
                AddLog($"Iniciando instalação de {fileName}...", LogLevel.Info);

                // Validate APK
                if (!_apkService.IsValidApkFile(apkPath))
                {
                    AddLog($"Arquivo APK inválido: {fileName}", LogLevel.Error);
                    return;
                }

                // Show progress
                this.Invoke(() =>
                {
                    _progressBar.Visible = true;
                    _progressLabel.Visible = true;
                    _progressLabel.Text = "Instalando...";
                    _progressBar.Style = ProgressBarStyle.Marquee;
                });

                // Install APK
                var result = await _adbService.InstallApkAsync(apkPath);

                if (result.Success)
                {
                    AddLog($"{fileName} instalado com sucesso!", LogLevel.Success);
                    MessageBox.Show($"{fileName} foi instalado com sucesso!", "Instalação Concluída", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    await LoadInstalledAppsAsync();
                }
                else
                {
                    AddLog($"Falha na instalação de {fileName}: {result.ErrorMessage}", LogLevel.Error);
                    MessageBox.Show($"Falha na instalação:\n\n{result.ErrorMessage}", "Erro na Instalação", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error installing APK: {apkPath}");
                AddLog($"Erro na instalação: {ex.Message}", LogLevel.Error);
            }
            finally
            {
                this.Invoke(() =>
                {
                    _progressBar.Visible = false;
                    _progressLabel.Visible = false;
                    _progressBar.Style = ProgressBarStyle.Blocks;
                });
            }
        }

        private void AddLog(string message, LogLevel level)
        {
            var logEntry = new LogEntry
            {
                Timestamp = DateTime.Now,
                Level = level,
                Message = message
            };

            _logEntries.Add(logEntry);

            this.Invoke(() =>
            {
                var color = level switch
                {
                    LogLevel.Error => Color.Red,
                    LogLevel.Warning => Color.Orange,
                    LogLevel.Success => Color.LightGreen,
                    _ => Color.White
                };

                _logTextBox.SelectionStart = _logTextBox.TextLength;
                _logTextBox.SelectionLength = 0;
                _logTextBox.SelectionColor = Color.Gray;
                _logTextBox.AppendText($"[{logEntry.Timestamp:HH:mm:ss}] ");
                
                _logTextBox.SelectionColor = color;
                _logTextBox.AppendText($"{message}\n");
                
                _logTextBox.SelectionColor = Color.White;
                _logTextBox.ScrollToCaret();
            });

            _logger.LogInformation($"{level}: {message}");
        }

        private string ExtractPackageName(string listBoxText)
        {
            // Extract package name from "DisplayName (package.name)" format
            var startIndex = listBoxText.LastIndexOf('(');
            var endIndex = listBoxText.LastIndexOf(')');
            
            if (startIndex >= 0 && endIndex > startIndex)
            {
                return listBoxText.Substring(startIndex + 1, endIndex - startIndex - 1);
            }
            
            return string.Empty;
        }

        private void MainForm_FormClosing(object? sender, FormClosingEventArgs e)
        {
            try
            {
                _apkService.CleanupTempFiles();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cleanup");
            }
        }
    }
}