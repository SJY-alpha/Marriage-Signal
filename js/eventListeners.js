import { generateFullStory, improveScript, saveProject, loadProject } from './app.js';
import { switchTab, showImageModal, closeImageModal, flipImageModal, downloadImageModal, closePromptModal, savePrompt, closePersonalityModal, savePersonality, closeConfirmModal, applyTtsSettingsToTimeline } from './ui.js';
import { playTimeline, pauseTimeline, stopTimeline } from './playback.js';
import { downloadAllTTS } from './audio.js';
import { state } from './app.js';


export function bindInitialEventListeners() {
    // ... 원본 bindInitialEventListeners 함수의 모든 addEventListener 내용
    document.getElementById('generate-story-btn').addEventListener('click', () => generateFullStory());
    document.getElementById('improve-script-btn').addEventListener('click', () => improveScript());

    document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', (e) => switchTab(e.currentTarget)));
    // ... 나머지 모든 이벤트 리스너
}
