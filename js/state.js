/**
 * @file js/state.js
 * @description 애플리케이션의 전역 상태를 중앙에서 관리합니다.
 */

// 애플리케이션의 주요 데이터와 상태를 저장하는 객체
export const appState = {
    // 생성된 시나리오 데이터
    data: {},
    // 전체 타임라인 재생 관련 상태
    playbackState: { 
        isPlaying: false, 
        intervalId: null, 
        currentAbsTime: 0, 
        currentCutIndex: -1, 
        currentShotIndex: -1, 
        audioContext: null, 
        audioSources: [] 
    },
    // 단일 대사 재생 관련 상태
    singlePlayback: { 
        audio: null, 
        controlsElement: null, 
        dialogue: null 
    },
    // TTS 미리듣기 오디오 캐시 및 상태
    ttsPreviewAudio: { 
        audio: null, 
        cache: {},
        button: null
    },
    // 편집기에서 현재 활성화된 탭 정보
    activeBgTab: 1,
    activePersonalityCategory: 0,
    // 성격 수정 모달에서 임시로 선택된 키워드
    tempSelectedPersonality: [],
    // 성격 키워드 시스템 데이터
    personalitySystem: { "옵션풀": {}, "캐릭터": [] }
};

// 자주 사용되는 DOM 요소를 캐싱하는 객체
export const DOM = {};

/**
 * ID를 기반으로 자주 사용하는 DOM 요소들을 찾아 DOM 객체에 저장합니다.
 * 페이지 로드 시 한 번만 호출하여 성능을 최적화합니다.
 */
export function cacheDomElements() {
    const ids = [
        'initial-settings', 'generate-story-btn', 'improve-script-btn', 'loading-indicator', 
        'loading-message', 'editor-section', 'character-references', 'background-tabs', 
        'background-references', 'timeline-container', 'total-time', 'current-time', 
        'video-player-modal', 'mention-dropdown', 'scenario-title', 'tts-debug-console', 
        'tts-debug-output', 'show-tts-console-btn', 'clear-tts-console-btn', 
        'close-tts-console-btn', 'narrator-voice', 'narrator-pitch-slider', 'narrator-speed-slider',
        'narrator-pitch-value', 'narrator-speed-value', 'narrator-voice-preview', 'narrator-apply-all',
        'timeline-play', 'timeline-pause', 'timeline-stop', 'save-project-btn', 'load-project-btn',
        'file-loader', 'player-close', 'download-all-audio-btn', 'show-subtitles',
        'image-modal', 'modal-image', 'modal-info', 'modal-flip', 'modal-download', 'modal-close',
        'prompt-modal', 'prompt-modal-title', 'prompt-modal-editor', 'translation-container',
        'prompt-modal-cancel', 'prompt-modal-save', 'personality-modal', 'personality-modal-title',
        'personality-selected-count', 'personality-category-tabs', 'personality-tags-container',
        'personality-modal-cancel', 'personality-modal-save', 'player-image', 'player-subtitles-container',
        'confirm-modal', 'confirm-modal-title', 'confirm-modal-message', 'confirm-modal-cancel', 'confirm-modal-confirm',
        'toast-container', 'keywords', 'duration', 'script-input', 'target-age'
    ];
    ids.forEach(id => {
        // ID를 camelCase로 변환 (e.g., 'generate-story-btn' -> 'generateStoryBtn')
        const key = id.replace(/-(\w)/g, (match, letter) => letter.toUpperCase());
        DOM[key] = document.getElementById(id);
    });
}
