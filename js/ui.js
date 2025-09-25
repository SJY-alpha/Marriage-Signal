/**
 * @file js/ui.js
 * @description UI 렌더링, 모달, 토스트 등 모든 DOM 관련 작업을 담당합니다.
 */

// 의존성 모듈 임포트
import { appState, DOM } from './state.js';
import { TTS_VOICES } from './constants.js';
import { 
    handlePromptAction, handlePromptClick, showMentionDropdown,
    moveCut, deleteCut, playSingleDialogue, stopSinglePlayback,
    refreshTTS, downloadSingleTTS, showPersonalityModal,
    updateCharacterDetails, previewTTSVoice, applyTtsSettingsToTimeline,
    replaceReferenceImage, regenerateReferenceImage, applyReferenceToAll,
    closeImageModal, flipImageModal, downloadImageModal,
    closePromptModal, savePrompt, closePersonalityModal, savePersonality,
    closeConfirmModal
} from './main.js'; // main.js에서 이벤트 핸들러를 가져옵니다.

// --- 렌더링 함수 ---

/** 전체 UI를 다시 렌더링합니다. */
export function renderAll() {
    DOM.scenarioTitle.textContent = appState.data.title;
    renderCharacters();
    renderBackgrounds();
    renderTimeline();
    updateTotalTime();
}

/** 탭 UI를 전환합니다. */
export function switchTab(button) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => {
        content.id === button.dataset.tab ? content.classList.remove('hidden') : content.classList.add('hidden');
    });
}

/** 캐릭터 레퍼런스 섹션을 렌더링합니다. */
function renderCharacters() {
    DOM.characterReferences.innerHTML = '';
    if(!appState.data.characters) return;
    const narrator = appState.data.characters.find(c => c.id === 'narrator');
    if (narrator) renderNarratorControls(narrator);
    
    appState.data.characters.forEach(char => {
        if (char.id === 'narrator') return;
        const card = createReferenceCard(char, 'character');
        DOM.characterReferences.appendChild(card);
    });
}

/** 나레이터 컨트롤 UI를 렌더링하고 값을 설정합니다. */
function renderNarratorControls(narrator) {
    populateNarratorVoices();
    DOM.narratorVoice.value = narrator.voice || 'Charon';
    DOM.narratorPitchSlider.value = narrator.pitch || 0.0;
    DOM.narratorSpeedSlider.value = narrator.speed || 1.0;
    DOM.narratorPitchValue.textContent = (narrator.pitch || 0.0).toFixed(2);
    DOM.narratorSpeedValue.textContent = (narrator.speed || 1.0).toFixed(2);
}

/** 배경 레퍼런스 섹션을 렌더링합니다. */
function renderBackgrounds() {
    DOM.backgroundTabs.innerHTML = '';
    if(!appState.data.backgrounds) return;
    const bgGroups = appState.data.backgrounds.reduce((acc, bg, index) => {
        const groupIndex = Math.floor(index / 2) + 1;
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(bg);
        return acc;
    }, {});

    Object.keys(bgGroups).forEach(key => {
        const tab = document.createElement('button');
        tab.className = `px-3 py-1 rounded-t-lg text-sm ${appState.activeBgTab == key ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'}`;
        tab.textContent = `배경 ${key}`;
        tab.dataset.tabId = key;
        tab.onclick = () => { appState.activeBgTab = key; renderBackgrounds(); };
        DOM.backgroundTabs.appendChild(tab);
    });

    DOM.backgroundReferences.innerHTML = '';
    if (bgGroups[appState.activeBgTab]) {
        bgGroups[appState.activeBgTab].forEach(bg => {
            DOM.backgroundReferences.appendChild(createReferenceCard(bg, 'background'));
        });
    }
}

/** 타임라인 섹션을 렌더링합니다. */
export function renderTimeline() {
    DOM.timelineContainer.innerHTML = '';
    if (!appState.data.cutscenes) return;

    appState.data.cutscenes.forEach((cut, index) => {
        const cutElement = document.createElement('div');
        cutElement.className = 'cutscene-card bg-gray-900 p-4 rounded-lg';
        cutElement.dataset.index = index;
        cutElement.dataset.activeShot = "0";

        const getChar = (charId) => appState.data.characters.find(c => c.id === charId);
        
        const shotsHTML = cut.shots.map((shot, shotIndex) => `
           <div class="shot-number">${'#' + (shotIndex + 1)}</div>
           <img src="${shot.image || 'https://placehold.co/540x960/374151/9ca3af?text=No+Image'}" 
                class="shot-image ${shotIndex === 0 ? 'active' : ''}" 
                data-shot-index="${shotIndex}">
        `).join('');

        const shotTabsHTML = cut.shots.length > 1 ? `
           <div class="shot-tabs">
               ${cut.shots.map((shot, shotIndex) => `
                   <button class="shot-tab ${shotIndex === 0 ? 'active' : ''}" data-shot-index="${shotIndex}">
                       샷 #${shotIndex + 1}
                   </button>`).join('')}
           </div>
        ` : '';

       const promptBoxesHTML = cut.shots.map((shot, shotIndex) => `
           <div class="shot-prompts-container ${shotIndex === 0 ? '' : 'hidden'}" data-shot-index="${shotIndex}">
               <div class="flex items-center space-x-2 mb-2">
                    <label class="shot-start-time-label">시작 시간:</label>
                    <input type="number" value="${(shot.startTime || 0).toFixed(1)}" class="shot-start-time" step="0.1" title="샷 시작 시간 (초)">s
               </div>
               ${createPromptBox(`이미지 프롬프트 #${shotIndex + 1}`, "imagePrompt", shot.imagePrompt, shotIndex)}
               ${createVideoPromptBox(shot.videoPrompt, shotIndex)}
           </div>
       `).join('');

        cutElement.innerHTML = `
            <div class="flex items-center mb-4">
                <span class="text-xl font-bold text-indigo-400 mr-4">#${index + 1}</span>
                <div class="flex items-center">
                    <label class="text-sm mr-2">시간(초):</label>
                    <input type="number" value="${cut.duration || 0}" class="w-20 bg-gray-700 p-1 rounded text-center cut-duration" ${cut.autoAdjustDuration ? 'readonly' : ''}>
                    <input type="checkbox" class="ml-2 auto-adjust-duration" ${cut.autoAdjustDuration ? 'checked' : ''} title="대사 길이에 따라 시간 자동 조절">
                </div>
                <div class="ml-auto flex items-center space-x-2">
                    <button class="control-btn" data-action="move-up" ${index === 0 ? "disabled" : ""} title="컷을 위로 이동"><i class="fas fa-arrow-up"></i></button>
                    <button class="control-btn" data-action="move-down" ${index === appState.data.cutscenes.length - 1 ? "disabled" : ""} title="컷을 아래로 이동"><i class="fas fa-arrow-down"></i></button>
                    <button class="control-btn" data-action="delete" title="이 컷을 삭제"><i class="fas fa-times-circle text-red-400"></i></button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <div class="relative group cutscene-image-container rounded-lg overflow-hidden">
                       ${shotsHTML}
                       <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button class="text-white text-2xl" title="이미지 크게 보기" data-action="view-cut-image"><i class="fas fa-expand"></i></button>
                       </div>
                   </div>
                </div>
                <div class="space-y-3">
                    ${shotTabsHTML}
                    ${promptBoxesHTML}
                </div>
            </div>
            <div class="mt-4 space-y-2">
                ${cut.dialogues.map((dialogue, i) => {
                    const character = getChar(dialogue.charId);
                    const charName = character ? character.name : "Unknown";
                    const isAudioReady = dialogue.cachedBlobUrl;
                    const durationText = dialogue.audioDuration ? `(${(dialogue.audioDuration).toFixed(1)}s)` : "(--s)";
                    const charColor = charName === "나레이션" ? "text-yellow-300" : "text-cyan-400";
                    return `
                    <div class="bg-gray-800 p-2 rounded-lg flex items-center">
                        <div class="flex flex-col w-24">
                           <span class="font-bold ${charColor} truncate" title="${charName}">${charName}:</span>
                           <input type="number" value="${(dialogue.startTime || 0).toFixed(1)}" class="dialogue-start-time w-16 bg-gray-700 p-1 rounded text-center text-xs mt-1" step="0.1" title="대사 시작 시간 (초)">
                        </div>
                        <input type="text" value="${(dialogue.text || '').replace(/"/g, "&quot;")}" class="flex-grow bg-gray-700 p-1 rounded mx-2 dialogue-text">
                        <div class="dialogue-controls flex items-center space-x-1">
                            <span class="audio-duration text-gray-400 text-xs w-12 text-center">${durationText}</span>
                            <button class="dialogue-copy-btn text-gray-300 hover:text-white" title="대사 복사"><i class="far fa-copy"></i></button>
                            <button class="dialogue-play-pause-btn text-gray-300 hover:text-white" title="음성 재생/일시정지"><i class="fas ${isAudioReady ? "fa-volume-up text-green-400" : "fa-play"}"></i></button>
                            <button class="dialogue-stop-btn hidden text-gray-300 hover:text-white" title="정지"><i class="fas fa-stop"></i></button>
                            <button class="dialogue-refresh-btn text-gray-300 hover:text-white" title="음성 다시 생성"><i class="fas fa-sync-alt"></i></button>
                            <button class="dialogue-download-btn text-gray-300 hover:text-white" title="MP3 저장"><i class="fas fa-download"></i></button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        DOM.timelineContainer.appendChild(cutElement);
        addEventListenersToCut(cutElement, index);
    });
}


// --- UI Element 생성 함수 ---

/**
 * 캐릭터 또는 배경을 위한 레퍼런스 카드를 생성합니다.
 * @param {object} item - 캐릭터 또는 배경 객체
 * @param {string} type - 'character' 또는 'background'
 * @returns {HTMLElement} 생성된 카드 요소
 */
function createReferenceCard(item, type) {
    // (원본 코드의 createReferenceCard 함수 내용과 거의 동일)
    // 단, 이벤트 리스너는 main.js의 핸들러 함수를 호출하도록 연결합니다.
    const card = document.createElement('div');
    card.className = 'bg-gray-700 rounded-lg overflow-hidden shadow-md flex flex-col';
    
    let extraControlsHTML = '';
    if (type === 'character') {
        card.dataset.characterId = item.id;
        const voiceList = TTS_VOICES.filter(v => v.gender === item.gender);
        const createOptions = (voices) => voices.map(v => `<option value="${v.name}" ${item.voice === v.name ? 'selected' : ''}>${formatVoiceForDisplay(v.name)}</option>`).join('');
        
        extraControlsHTML = `
        <div class="text-xs text-gray-400 mt-2 flex items-center">
            <input type="text" value="${item.nationality || '한국'}" class="nationality-input bg-gray-600 p-1 rounded w-16" title="국적">
            <span class="ml-2">${item.gender}</span>
        </div>
        <div class="mt-2">
            <div class="flex items-center space-x-2">
                <select class="w-full bg-gray-600 text-white text-sm rounded p-1 voice-select" title="캐릭터 목소리 종류를 변경합니다.">${createOptions(voiceList)}</select>
                <button class="voice-preview-btn bg-blue-600 hover:bg-blue-700 p-1 rounded-md text-xs" title="선택된 목소리 미리듣기"><i class="fas fa-play"></i></button>
                <button class="apply-tts-settings-btn bg-teal-600 hover:bg-teal-500 p-1 rounded-md text-xs" title="현재 목소리 설정을 모든 대사에 적용"><i class="fas fa-broadcast-tower"></i></button>
            </div>
        </div>
        <div class="mt-2 text-xs">
            <div class="grid grid-cols-2 gap-x-2">
                <div>
                    <label class="text-gray-400">피치: <span class="pitch-value">${item.pitch?.toFixed(2) || '0.00'}</span></label>
                    <input type="range" class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer pitch-slider" min="-2.0" max="2.0" step="0.01" value="${item.pitch || 0.0}" title="목소리 높낮이 조절">
                </div>
                 <div>
                    <label class="text-gray-400">속도: <span class="speed-value">${item.speed?.toFixed(2) || '1.00'}</span></label>
                    <input type="range" class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer speed-slider" min="0.45" max="1.85" step="0.01" value="${item.speed || 1.0}" title="말하기 속도 조절">
                </div>
            </div>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-personality" title="캐릭터 성격 키워드를 수정합니다."><i class="fas fa-user-edit mr-1"></i> 성격</button>
            <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-prompt" title="이미지 생성을 위한 레퍼런스 프롬프트를 수정합니다."><i class="fas fa-file-alt mr-1"></i> 프롬프트</button>
        </div>`;
    } else {
         extraControlsHTML = `<div class="mt-2 grid grid-cols-1 gap-2 text-sm"><button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-prompt" title="배경 이미지 생성을 위한 레퍼런스 프롬프트를 수정합니다."><i class="fas fa-file-alt mr-1"></i> 프롬프트</button></div>`;
    }

    card.innerHTML = `
        <div class="reference-image-container bg-gray-600">
            <img src="${item.image || 'https://placehold.co/540x960/374151/9ca3af?text=No+Image'}" alt="${item.name}" class="cursor-pointer hover:opacity-80 transition-opacity">
        </div>
        <div class="p-3 flex-grow flex flex-col">
            <div class="flex items-center mb-1">
                <input type="text" value="${item.name}" class="name-input bg-gray-600 rounded-l p-1 text-white font-bold w-full">
                <button class="apply-char-details-btn bg-green-600 hover:bg-green-700 p-1 rounded-r px-2" title="이름 및 국적 변경 적용"><i class="fas fa-check"></i></button>
            </div>
             ${extraControlsHTML}
            <div class="mt-auto pt-2 grid grid-cols-3 gap-2 text-sm">
                <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="replace" title="내 컴퓨터에서 이미지 업로드"><i class="fas fa-upload mr-1"></i></button>
                <button class="bg-indigo-600 hover:bg-indigo-500 p-2 rounded transition-colors" data-action="regenerate" title="AI로 이미지 다시 생성"><i class="fas fa-sync-alt mr-1"></i></button>
                <button class="bg-teal-600 hover:bg-teal-500 p-2 rounded transition-colors" data-action="apply-all" title="현재 캐릭터의 모든 설정을 타임라인에 일괄 적용"><i class="fas fa-check-double mr-1"></i></button>
            </div>
        </div>`;
    
    addEventListenersToReferenceCard(card, item, type);
    return card;
}

// ... (createPromptBox, createVideoPromptBox, createLoadingOverlay 등 UI 생성 관련 함수들) ...
// (이하 원본 코드의 UI 관련 함수들을 여기에 배치)

// --- 모달 및 알림 함수 ---
export function showToast(message, type = 'info') {
    // ...
}
export function showConfirmModal(title, message, onConfirm) {
    // ...
}

// --- 기타 UI 헬퍼 함수 ---
/** 나레이터 음성 선택 목록을 채웁니다. */
export function populateNarratorVoices() {
    // ...
}
/** 총 영상 시간을 업데이트합니다. */
export function updateTotalTime() {
    if (!appState.data.cutscenes) return;
    const total = appState.data.cutscenes.reduce((sum, cut) => sum + (parseFloat(cut.duration) || 0), 0);
    DOM.totalTime.textContent = total.toFixed(1);
}

// --- 이 파일 내부에서만 사용하는 헬퍼 및 이벤트 리스너 추가 함수 ---

/** 타임라인의 각 컷에 이벤트 리스너를 추가합니다. */
function addEventListenersToCut(cutElement, index) {
    // ... (원본 코드의 renderTimeline 내부 이벤트 리스너 로직)
}

/** 레퍼런스 카드에 이벤트 리스너를 추가합니다. */
function addEventListenersToReferenceCard(card, item, type) {
    // ... (원본 코드의 createReferenceCard 내부 이벤트 리스너 로직)
}

// (이하 생략 - 원본 코드의 UI 관련 함수들을 이 파일로 모두 옮겨옵니다.)
// (예: showImageModal, closeImageModal, showPromptModal, showPersonalityModal 등)
