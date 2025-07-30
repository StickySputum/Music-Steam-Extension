let socket;
let activeTabId = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Подключение к WebSocket серверу с автоматическим переподключением
function connectWebSocket() {
  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    console.log('[BG] ✅ Connected to WS server');
    reconnectAttempts = 0;
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
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(3000 * (reconnectAttempts + 1), 15000); // Экспоненциальная задержка
      console.log(`[BG] WS closed, reconnecting in ${delay}ms...`);
      setTimeout(connectWebSocket, delay);
      reconnectAttempts++;
    } else {
      console.error('[BG] Max reconnection attempts reached');
    }
  };
}

// Поиск активной вкладки SoundCloud с периодической проверкой
async function findSoundCloudTab() {
  const tabs = await chrome.tabs.query({ url: "*://*.soundcloud.com/*" });
  
  if (tabs.length > 0) {
    activeTabId = tabs[0].id;
    console.log(`[BG] Found SoundCloud tab: ${activeTabId}`);
    
    // Периодическая проверка активности вкладки
    setInterval(async () => {
      try {
        await chrome.tabs.sendMessage(activeTabId, { command: 'ping' });
      } catch (err) {
        console.log('[BG] SoundCloud tab is no longer responsive, finding new tab...');
        activeTabId = null;
        await findSoundCloudTab();
      }
    }, 10000); // Проверка каждые 10 секунд
    
    return true;
  }
  
  console.log('[BG] SoundCloud tab not found, retrying...');
  setTimeout(findSoundCloudTab, 5000); // Повторная попытка через 5 секунд
  return false;
}

// Отправка команд на вкладку SoundCloud с автоматическим поиском вкладки
async function sendCommandToTab(command) {
  if (!activeTabId) {
    await findSoundCloudTab();
    if (!activeTabId) {
      console.log('[BG] No SoundCloud tab found for command:', command);
      return;
    }
  }

  try {
    await chrome.tabs.sendMessage(activeTabId, { command });
  } catch (err) {
    console.error('[BG] Command error:', err);
    activeTabId = null;
    await sendCommandToTab(command); // Рекурсивный вызов после ошибки
  }
}

// Отслеживание изменений вкладок
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.url?.includes('soundcloud.com') && changeInfo.status === 'complete') {
    activeTabId = tabId;
    console.log(`[BG] Active SoundCloud tab updated: ${tabId}`);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    console.log('[BG] SoundCloud tab closed');
    activeTabId = null;
    findSoundCloudTab();
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