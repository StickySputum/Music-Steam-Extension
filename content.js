// Отправка состояния воспроизведения и информации о треке
function sendPlaybackState() {
  // Находим элементы
  const titleSpan = document.querySelector('.playbackSoundBadge__titleLink span[aria-hidden="true"]');
  const isPlaying = !!document.querySelector('button[title="Pause current"], button[aria-label="Pause"]');
  
  if (titleSpan) {
    // Очищаем название трека от лишнего текста
    let trackInfo = titleSpan.textContent
      .replace(/Current track: /gi, '')
      .replace(/\s*-\s*$/, '')
      .trim();
    
    chrome.runtime.sendMessage({
      type: 'playbackUpdate',
      state: {
        isPlaying: isPlaying,
        trackInfo: trackInfo
      }
    });
  } else {
    // Fallback если не нашли основной элемент
    const titleEl = document.querySelector('.playbackSoundBadge__titleLink, .playbackSoundBadge__title a');
    const artistEl = document.querySelector('.playbackSoundBadge__lightLink, .playbackSoundBadge__username a');
    
    chrome.runtime.sendMessage({
      type: 'playbackUpdate',
      state: {
        isPlaying: isPlaying,
        trackInfo: artistEl ? `${artistEl.textContent} - ${titleEl?.textContent || titleEl?.title || ''}`.trim() : 'Not playing'
      }
    });
  }
}

// Отслеживание изменений на странице
const observer = new MutationObserver(sendPlaybackState);
observer.observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['title', 'aria-label', 'aria-hidden']
});

// Первоначальная отправка состояния
setTimeout(sendPlaybackState, 1000);

// Обработчик команд от фонового скрипта
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'togglePlayback') {
    const btn = document.querySelector('button[title="Play current"], button[title="Pause current"]');
    if (btn) {
      btn.click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
  else if (request.command === 'prevTrack') {
    const btn = document.querySelector('.skipControl__previous');
    if (btn) {
      btn.click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
  else if (request.command === 'nextTrack') {
    const btn = document.querySelector('.skipControl__next');
    if (btn) {
      btn.click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
});