const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process'); // Backend'i ayrı bir process'te çalıştırmak için

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // Güvenlik için false önerilir
      contextIsolation: true, // Güvenlik ve performans için true önerilir
      preload: path.join(__dirname, 'preload.js') // İsteğe bağlı: Ön yükleme betiği
    }
  });

  // Geliştirme modunda URL'yi veya production'da build edilmiş HTML'i yükle
  // Dikkat: Client uygulamanız bir geliştirme sunucusu (örn. localhost:3000) kullanıyorsa burayı ona göre ayarlayın.
  // Eğer client statik dosyalardan oluşuyorsa (build edildiyse):
  mainWindow.loadFile(path.join(__dirname, 'client/build/index.html')); // Build edilmiş client yolu
  // Şimdilik public içindeki index.html'i yükleyelim, build adımını sonra düşünürüz.
  // mainWindow.loadFile(path.join(__dirname, 'client/public/index.html')); // Bu satır yorumlandı


  // Geliştirici araçlarını aç (isteğe bağlı)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  // Backend sunucusunu ayrı bir process olarak başlat
  // package.json'daki start script'ini kullanabiliriz
  const backendPath = path.join(__dirname, 'backend', 'server.js');
  serverProcess = fork(backendPath, [], {
      // Gerekirse ortam değişkenleri veya diğer seçenekler eklenebilir
      // cwd: path.join(__dirname, 'backend') // Eğer backend'in çalışma dizini farklıysa
  });

  serverProcess.on('message', (message) => {
    console.log('Backend message:', message);
  });

  serverProcess.on('error', (err) => {
    console.error('Backend error:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    serverProcess = null; // Process sonlandığında referansı temizle
  });
}

app.on('ready', () => {
  startServer(); // Backend sunucusunu başlat
  createWindow(); // Electron penceresini oluştur
});

app.on('window-all-closed', function () {
  // macOS dışındaki tüm platformlarda, tüm pencereler kapatıldığında uygulamayı kapat
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Uygulama kapanmadan önce backend process'ini sonlandır
  if (serverProcess) {
    console.log('Terminating backend process...');
    serverProcess.kill();
  }
});

app.on('activate', function () {
  // macOS'ta, dock ikonu tıklandığında ve başka pencere açık değilse yeni pencere aç
  if (mainWindow === null) {
    createWindow();
  }
});

// İsteğe bağlı: preload.js içeriği (Güvenlik için kullanılır)
// Bu dosya, renderer process'e güvenli bir şekilde Node.js API'lerini sunmak için kullanılır.
// Şimdilik boş veya temel bir preload.js oluşturabiliriz.
// console.log('Preload script loaded');
// const { contextBridge, ipcRenderer } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   // Güvenli IPC fonksiyonları buraya eklenebilir
// }); 