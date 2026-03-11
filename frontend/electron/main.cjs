const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let monitorWindow;
let backendProcess; //全域變數, 防止重複執行

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // 若需要簡單的 IPC 或是使用 preload
            webSecurity: false, // 若有嚴格需求允許載入本地資源，通常不建議在 localhost 使用
            webviewTag: true
        },
        // 高級質感: 可以保留預設邊框或自訂。為了穩定性我們先保留預設。
        backgroundColor: '#121212',
        show: false // 準備好後再顯示
    });

    // 載入 Vite 應用程式
    // 開發模式: 從 localhost:5173 載入
    // 生產模式: 從 dist/index.html 載入
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 資源優化：視窗焦點監聽
    mainWindow.on('focus', () => {
        mainWindow.webContents.send('app-focus-changed', true);
        // 若在 Windows 系統，可以在此將後端優先級調回正常
        // 目前暫時不強制調整優先級以避免權限問題，先以暫停前端動畫為主
    });

    mainWindow.on('blur', () => {
        mainWindow.webContents.send('app-focus-changed', false);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    const isDev = !app.isPackaged;
    let scriptPath;
    let pythonPath;

    if (isDev) {
        // 開發模式: 使用本地 venv
        // 假設從專案根目錄或 frontend 資料夾執行。
        // 我們需要找到 venv python 的絕對路徑。
        // 假設此腳本是從 `frontend` 或專案根目錄執行。
        // 如果是從 `frontend` (透過 npm) 執行，則是 `../venv`
        pythonPath = path.join(__dirname, '../../venv/Scripts/python.exe'); // frontend/electron/ -> ../../venv
        scriptPath = path.join(__dirname, '../../backend/main.py');
    } else {
        // 生產模式: 解壓縮後的 python 或類似環境。
        // 暫時簡化: 假設使用者路徑中有 python 或已打包。
        // 對於此原型，我們主要依賴開發環境路徑。
        pythonPath = path.join(process.resourcesPath, 'venv/Scripts/python.exe');
        scriptPath = path.join(process.resourcesPath, 'backend/main.py');
    }

    console.log(`正在啟動後端，使用: ${pythonPath} ${scriptPath}`);

    backendProcess = spawn(pythonPath, [scriptPath], {
        cwd: path.dirname(scriptPath),
        stdio: 'pipe' // 改為 pipe 以便捕獲日誌
    });

    backendProcess.stdout.on('data', (data) => {
        const text = data.toString();
        process.stdout.write(text); // 同時輸出到主進程控制台
        if (monitorWindow) {
            monitorWindow.webContents.send('backend-log', text);
        }
    });

    backendProcess.stderr.on('data', (data) => {
        const text = data.toString();
        process.stderr.write(text);
        if (monitorWindow) {
            monitorWindow.webContents.send('backend-log', `[ERROR] ${text}`);
        }
    });

    backendProcess.on('error', (err) => {
        console.error('後端啟動失敗:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.log(`後端已退出，代碼 ${code}，訊號 ${signal}`);
    });
}

function checkBackendReady(callback) {
    http.get(`${BACKEND_URL}/status`, (res) => {
        if (res.statusCode === 200) {
            callback();
        } else {
            setTimeout(() => checkBackendReady(callback), 1000);
        }
    }).on('error', () => {
        setTimeout(() => checkBackendReady(callback), 1000);
    });
}

// 開發者監控視窗 IPC
ipcMain.on('open-monitor', () => {
    if (monitorWindow) {
        monitorWindow.focus();
        return;
    }

    monitorWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Backend Monitor',
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    monitorWindow.loadFile(path.join(__dirname, '../monitor.html'));

    monitorWindow.on('closed', () => {
        monitorWindow = null;
    });
});

// 開發者指令轉發: Monitor -> Main Process -> Main Window
ipcMain.on('dev-command', (event, cmd) => {
    console.log('[Main] Received dev-command:', cmd);
    if (mainWindow) {
        mainWindow.webContents.send('execute-dev-command', cmd);
    } else {
        console.warn('[Main] Cannot forward dev-command: mainWindow is null');
    }
});

app.on('ready', () => {
    startBackend();
    // 等待後端？對於 UI 載入來說並非絕對必要，但是個好習慣。
    createWindow();
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
