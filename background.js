let socket;
let activeTabId = null;
const RECONNECT_DELAY = 3000;

// Подключение к WebSocket
function connect() {
  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    console.log('[BG] ✅ Connected to WebSocket server');
  };

  socket.onmessage = async (event) => {
    if (event.data === 'play') {
      await handlePlayCommand();
    }
  };

  socket.onerror = (error) => {
    console.error('[BG] WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('[BG] WebSocket closed, reconnecting...');
    setTimeout(connect, RECONNECT_DELAY);
  };
}

// Обработка команды play
async function handlePlayCommand() {
  if (!activeTabId) {
    console.log('[BG] No active SoundCloud tab found');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(activeTabId, {
      command: 'play'
    });
    console.log('[BG] Play command result:', response);
  } catch (err) {
    console.error('[BG] Error sending command:', err.message);
  }
}

// Отслеживание активной вкладки SoundCloud
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url?.includes('soundcloud.com') && changeInfo.status === 'complete') {
    activeTabId = tabId;
    console.log(`[BG] Active SoundCloud tab: ${tabId}`);
  }
});

// Инициализация
connect();