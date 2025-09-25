import { DOM_ELEMENTS, CURRENT_VERSION, PERSONALITY_SYSTEM_URL } from './config.js';
import { showToast, logToTTSConsole, renderAll, updateLoadingMessage, applyPersonality, intelligentlySetAllTimings } from './ui.js';
import { bindInitialEventListeners } from './eventListeners.js';
import { generateStoryAPI, improveScriptAPI, generateImageAPI } from './api.js';
import { generateAndCacheTTS } from './audio.js';
import { blobToBase64, wavBlobToArrayBuffer } from './utils.js';

export let state = {
    story: {},
    activeBgTab: 1,
    personalitySystem: { "옵션풀": {}, "캐릭터": [] },
    playbackState: { isPlaying: false, intervalId: null, currentAbsTime: 0, currentCutIndex: -1, currentShotIndex: -1, audioContext: null, audioSources: [] },
    singlePlayback: { audio: null, controlsElement: null, },
    ttsPreviewAudio: { audio: null, cache: {} },
    activePersonalityCategory: 0,
    tempSelectedPersonality: [],
};

async function loadPersonalityData() {
    try {
        const response = await fetch(PERSONALITY_SYSTEM_URL);
        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
        const data = await response.json();
        if (data && data.옵션풀 && data.캐릭터) {
            state.personalitySystem = data;
            logToTTSConsole('성격 키워드 시스템 로드 성공', `${state.personalitySystem.캐릭터.length}개의 키워드 그룹 로드됨`);
        } else {
            throw new Error("JSON data is invalid.");
        }
    } catch (error) {
        console.error('Failed to load personality data:', error);
        logToTTSConsole('성격 키워드 시스템 로드 실패', { error: error.message }, true);
        showToast('성격 시스템 데이터 로드에 실패했습니다.', 'error');
    }
}

export async function generateFullStory() {
    // ... 원본 generateFullStory 함수 내용
    // API 호출 부분은 api.js의 함수로 대체
    // 예: let storyData = await this.generateStoryAPI(...) -> let storyData = await generateStoryAPI(...)
}

export async function improveScript() {
    // ... 원본 improveScript 함수 내용
}

export async function saveProject() {
    // ... 원본 saveProject 함수 내용
}

export async function loadProject(event) {
    // ... 원본 loadProject 함수 내용
}

export function migrateProjectData(data) {
    // ... 원본 migrateProjectData 함수 내용
}

export async function initializeApp() {
    await loadPersonalityData();
    // populateNarratorVoices(); // ui.js로 이동 가능
    bindInitialEventListeners();
    // initTTSDebugConsole(); // ui.js로 이동 가능
}
