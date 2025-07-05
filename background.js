let socket;
let activeTabId = null;

// Подключение к WebSocket серверу
function connectWebSocket() {
  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    console.log('[BG] ✅ Connected to WS server');
    findSoundCloudTab();
  };

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'togglePlayback') {
      await sendCommandToTab('togglePlayback');
    }
    else if (data.type === 'prevTrack') {
      await sendCommandToTab('prevTrack');
    }
    else if (data.type === 'nextTrack') {
      await sendCommandToTab('nextTrack');
    }
  };

  socket.onerror = (error) => {
    console.error('[BG] WS error:', error);
  };

  socket.onclose = () => {
    console.log('[BG] WS closed, reconnecting...');
    setTimeout(connectWebSocket, 3000);
  };
}

// Отправка команд на вкладку SoundCloud
async function sendCommandToTab(command) {
  if (!activeTabId) {
    await findSoundCloudTab();
    if (!activeTabId) {
      console.log('[BG] No SoundCloud tab found');
      return;
    }
  }

  try {
    await chrome.tabs.sendMessage(activeTabId, { command });
  } catch (err) {
    console.error('[BG] Command error:', err);
    activeTabId = null;
  }
}

// Поиск активной вкладки SoundCloud
async function findSoundCloudTab() {
  const tabs = await chrome.tabs.query({ url: "*://*.soundcloud.com/*" });
  if (tabs.length > 0) {
    activeTabId = tabs[0].id;
    console.log(`[BG] Found SoundCloud tab: ${activeTabId}`);
    return true;
  }
  console.log('[BG] SoundCloud tab not found');
  activeTabId = null;
  return false;
}

// Отслеживание вкладок
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url?.includes('soundcloud.com') && changeInfo.status === 'complete') {
    activeTabId = tabId;
    console.log(`[BG] Active SoundCloud tab: ${tabId}`);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    console.log('[BG] SoundCloud tab closed');
    activeTabId = null;
  }
});

// Пересылка сообщений от content script
chrome.runtime.onMessage.addListener((message) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
});

// Инициализация
connectWebSocket();