// Регистрация обработчика сообщений
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'play') {
    const result = togglePlayback();
    sendResponse(result);
  }
  return true;
});

// Поиск и нажатие кнопки
function togglePlayback(attempts = 3) {
  const btn = findPlayButton();
  
  if (btn) {
    simulateClick(btn);
    return { success: true, action: btn.title.includes('Pause') ? 'paused' : 'played' };
  }

  if (attempts > 0) {
    setTimeout(() => togglePlayback(attempts - 1), 500);
    return { error: 'retrying' };
  }

  return { error: 'button_not_found' };
}

// Поиск кнопки с учетом разных версий SoundCloud
function findPlayButton() {
  return document.querySelector(
    'button[title="Play current"], button[title="Pause current"], ' +
    'button[aria-label="Play"], button[aria-label="Pause"]'
  );
}

// Реалистичная имитация клика
function simulateClick(element) {
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    view: window,
    cancelable: true
  }));
}

// Сигнал о готовности
chrome.runtime.sendMessage({ type: 'contentScriptReady' });