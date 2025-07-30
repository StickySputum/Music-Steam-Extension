// SoundCloud Remote - Content Script
console.log('[CS] SoundCloud Remote content script loaded');

// Отправка состояния воспроизведения и информации о треке
function sendPlaybackState() {
    try {
        // Находим элементы на странице SoundCloud
        const titleSpan = document.querySelector('.playbackSoundBadge__titleLink span[aria-hidden="true"]');
        const isPlaying = !!document.querySelector('button[title="Pause current"], button[aria-label="Pause"]');
        
        let trackInfo = 'Not playing';
        
        if (titleSpan) {
            // Очищаем название трека от лишнего текста
            trackInfo = titleSpan.textContent
                .replace(/Current track: /gi, '')
                .replace(/\s*-\s*$/, '')
                .trim();
        } else {
            // Fallback если не нашли основной элемент
            const titleEl = document.querySelector('.playbackSoundBadge__titleLink, .playbackSoundBadge__title a');
            const artistEl = document.querySelector('.playbackSoundBadge__lightLink, .playbackSoundBadge__username a');
            
            if (artistEl && titleEl) {
                trackInfo = `${artistEl.textContent} - ${titleEl.textContent || titleEl.title || ''}`.trim();
            }
        }

        // Отправляем состояние в background script
        chrome.runtime.sendMessage({
            type: 'playbackUpdate',
            state: {
                isPlaying: isPlaying,
                trackInfo: trackInfo,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        console.error('[CS] Error in sendPlaybackState:', error);
        // Повторяем попытку через 1 секунду при ошибке
        setTimeout(sendPlaybackState, 1000);
    }
}

// Отслеживание изменений на странице
const observer = new MutationObserver(() => {
    sendPlaybackState();
});

// Начинаем наблюдение за изменениями DOM
function startObserver() {
    try {
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['title', 'aria-label', 'aria-hidden', 'class']
        });
        console.log('[CS] DOM observer started');
    } catch (error) {
        console.error('[CS] Failed to start observer:', error);
        setTimeout(startObserver, 2000);
    }
}

// Обработчик команд от фонового скрипта
function handleCommand(request, sender, sendResponse) {
    try {
        switch (request.command) {
            case 'togglePlayback':
                const playPauseBtn = document.querySelector('button[title="Play current"], button[title="Pause current"], button[aria-label="Play"], button[aria-label="Pause"]');
                if (playPauseBtn) {
                    playPauseBtn.click();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Play/Pause button not found' });
                }
                break;

            case 'prevTrack':
                const prevBtn = document.querySelector('.skipControl__previous');
                if (prevBtn) {
                    prevBtn.click();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Previous button not found' });
                }
                break;

            case 'nextTrack':
                const nextBtn = document.querySelector('.skipControl__next');
                if (nextBtn) {
                    nextBtn.click();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Next button not found' });
                }
                break;

            case 'ping':
                // Ответ на проверку активности
                sendResponse({ pong: true, active: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown command' });
        }
    } catch (error) {
        console.error('[CS] Command error:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // Указываем, что ответ будет асинхронным
}

// Инициализация
function init() {
    console.log('[CS] Initializing SoundCloud Remote');
    
    // Начальная отправка состояния
    setTimeout(sendPlaybackState, 1500);
    
    // Запускаем observer
    startObserver();
    
    // Устанавливаем обработчик команд
    chrome.runtime.onMessage.addListener(handleCommand);
    
    // Периодическая проверка соединения
    setInterval(() => {
        chrome.runtime.sendMessage({ type: 'heartbeat' })
            .catch(error => console.log('[CS] Heartbeat failed:', error));
    }, 30000);
    
    // Отслеживаем события клавиатуры для отладки
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.shiftKey && e.code === 'KeyD') {
            console.log('[CS] Debug info:', {
                trackInfo: document.querySelector('.playbackSoundBadge__titleLink')?.textContent,
                isPlaying: !!document.querySelector('button[title="Pause current"], button[aria-label="Pause"]')
            });
        }
    });
}

// Запускаем инициализацию после загрузки страницы
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
} else {
    document.addEventListener('DOMContentLoaded', init);
}

// Обработчик для обновления страницы
window.addEventListener('beforeunload', () => {
    observer.disconnect();
    console.log('[CS] Page unloading, cleaning up');
});