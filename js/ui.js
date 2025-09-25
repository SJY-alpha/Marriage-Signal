import { state, app } from './app.js';
import { DOM_ELEMENTS, TTS_VOICES } from './config.js';
import { generateAndCacheTTS, previewTTSVoice } from './audio.js';
import { translateTextAPI, refineCharacterPromptAPI, generateImageAPI } from './api.js';
import { forceAspect } from './utils.js';

export function renderAll() {
    // ... 원본 renderAll 함수 내용
}

export function renderTimeline() {
    // ... 원본 renderTimeline 함수 내용
}

// ... createPromptBox, createReferenceCard, renderCharacters, renderBackgrounds 등 모든 UI 관련 함수

export function showToast(message, type = 'info') {
    // ... 원본 showToast 함수 내용
}

export function logToTTSConsole(title, data, isError = false) {
    // ... 원본 logToTTSConsole 함수 내용
}

// ... showImageModal, closeImageModal, showPromptModal 등 모든 모달 관련 함수
