// preload.js
// Bu dosya, renderer process (React uygulaması) ile main process (Electron)
// arasında güvenli iletişim kurmak için kullanılır.
// Şimdilik boş bırakılabilir veya contextBridge API kullanılarak
// belirli fonksiyonlar güvenli bir şekilde renderer'a sunulabilir.

console.log('Preload script loaded.');

// Örnek contextBridge kullanımı:
// const { contextBridge, ipcRenderer } = require('electron');
// 
// contextBridge.exposeInMainWorld('electronAPI', {
//   sendMessage: (channel, data) => ipcRenderer.send(channel, data),
//   onMessage: (channel, func) => {
//     // Güvenlik için sadece belirli kanallara izin verilebilir
//     ipcRenderer.on(channel, (event, ...args) => func(...args));
//   }
// }); 