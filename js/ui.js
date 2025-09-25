/**
 * @file js/ui.js
 * @description UI 렌더링, 모달, 토스트 등 모든 DOM 관련 작업을 담당합니다.
 */

// 의존성 모듈 임포트
import { appState, DOM } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/state.js';
import { TTS_VOICES } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/constants.js';
import { 
    handlePromptAction, 
    moveCut, 
    deleteCut, 
    playSingleDialogue, 
    stopSinglePlayback,
    downloadSingleTTS, 
    previewTTSVoice, 
    applyTtsSettingsToTimeline,
    applyReferenceToAll,
    savePersonality
} from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/main.js';
import { copyTextToClipboard } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/utils.js';


// --- 렌더링 함수 ---

/** 전체 UI를 다시 렌더링합니다. */
export function renderAll() {
    if (!appState.data || !appState.data.title) return;
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
export function renderCharacters() {
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
    populateNarratorVoices(TTS_VOICES);
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


// --- UI Element 생성 및 이벤트 리스너 부착 ---

/**
 * 캐릭터 또는 배경을 위한 레퍼런스 카드를 생성합니다.
 * @param {object} item - 캐릭터 또는 배경 객체
 * @param {string} type - 'character' 또는 'background'
 * @returns {HTMLElement} 생성된 카드 요소
 */
function createReferenceCard(item, type) {
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

function createPromptBox(title, type, content, shotIndex) { return `<div class="bg-gray-800 rounded-lg prompt-container" data-type="${type}" data-shot-index="${shotIndex}"><div class="prompt-box-header bg-gray-700 p-2 rounded-t-lg flex justify-between items-center text-sm"><span class="font-semibold">${title}</span><div><button data-action="copy" title="프롬프트 복사"><i class="far fa-copy"></i></button><button data-action="edit" class="ml-2" title="프롬프트 편집"><i class="far fa-edit"></i></button><button data-action="regenerate" class="ml-2" title="이미지 다시 생성"><i class="fas fa-sync-alt"></i></button></div></div><div class="prompt-input" contenteditable="true">${formatPromptForEditing(content || '')}</div></div>`; }

function createVideoPromptBox(videoPrompt, shotIndex) {
    if (!videoPrompt || typeof videoPrompt !== 'object') {
         return createPromptBox(`영상 프롬프트 #${shotIndex + 1}`, "videoPrompt", "", shotIndex);
    }
    const { type, tip, prompt } = videoPrompt;
    const title = type === 'hailuo' ? `Hailuo AI 프롬프트 #${shotIndex + 1}` : `캡컷 팁 #${shotIndex + 1}`;
    const content = type === 'hailuo' ? prompt : tip;
    const translateButton = type === 'hailuo' ? `<button data-action="translate" class="ml-2" title="프롬프트 번역"><i class="fas fa-language"></i></button>` : '';

    return `<div class="bg-gray-800 rounded-lg prompt-container" data-type="videoPrompt" data-shot-index="${shotIndex}"><div class="prompt-box-header bg-gray-700 p-2 rounded-t-lg flex justify-between items-center text-sm"><span class="font-semibold">${title}</span><div><button data-action="copy" title="복사"><i class="far fa-copy"></i></button>${translateButton}<button data-action="edit" class="ml-2" title="편집"><i class="far fa-edit"></i></button></div></div><div class="prompt-input" contenteditable="true">${formatPromptForEditing(content || '')}</div></div>`;
}

/**
 * 동적으로 생성된 레퍼런스 카드에 이벤트 리스너를 추가합니다.
 * @param {HTMLElement} card - 이벤트 리스너를 추가할 카드 요소
 * @param {object} item - 카드에 해당하는 데이터 객체
 * @param {string} type - 'character' 또는 'background'
 */
function addEventListenersToReferenceCard(card, item, type) {
    const itemElement = card.querySelector('img');
    itemElement.addEventListener('click', () => showImageModal(item.image, `레퍼런스: ${item.name}`));
    
    card.querySelector('[data-action="edit-prompt"]').addEventListener('click', () => showPromptModal('레퍼런스 프롬프트 편집', item.prompt, (newPromptEditor) => { item.prompt = parsePromptFromEditing(newPromptEditor); }));
    
    if (type === 'character') {
        card.querySelector('.apply-char-details-btn').addEventListener('click', (e) => {
            const newName = card.querySelector('.name-input').value;
            const newNationality = card.querySelector('.nationality-input').value;
            updateCharacterDetails(item.id, newName, newNationality);
        });
        card.querySelector('.voice-select').addEventListener('change', (e) => { item.voice = e.target.value });
        
        const pitchSlider = card.querySelector('.pitch-slider');
        pitchSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            item.pitch = value;
            card.querySelector('.pitch-value').textContent = value.toFixed(2);
        });
        const speedSlider = card.querySelector('.speed-slider');
        speedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            item.speed = value;
            card.querySelector('.speed-value').textContent = value.toFixed(2);
        });

        card.querySelector('.voice-preview-btn').addEventListener('click', (e) => {
            const voiceName = card.querySelector('.voice-select').value;
            previewTTSVoice({ voice: voiceName, speed: item.speed, pitch: item.pitch }, e.currentTarget);
        });
        card.querySelector('[data-action="edit-personality"]').addEventListener('click', () => showPersonalityModal(item));
        card.querySelector('.apply-tts-settings-btn').addEventListener('click', () => applyTtsSettingsToTimeline(item.id));
    }
    card.querySelector('[data-action="replace"]').addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                item.image = await utils.forceAspect(event.target.result);
                itemElement.src = item.image;
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    });
    card.querySelector('[data-action="regenerate"]').addEventListener('click', async () => {
        const container = itemElement.parentElement;
        const overlay = createLoadingOverlay();
        container.appendChild(overlay);
        item.image = await api.generateImageForCut(item, {}, {}, utils.forceAspect);
        itemElement.src = item.image;
        container.removeChild(overlay);
    });
    card.querySelector('[data-action="apply-all"]').addEventListener('click', () => applyReferenceToAll(item.id));
}

/**
 * 동적으로 생성된 컷(Cut) 요소에 이벤트 리스너를 추가합니다.
 * @param {HTMLElement} cutElement - 이벤트 리스너를 추가할 컷 요소
 * @param {number} index - 해당 컷의 인덱스
 */
function addEventListenersToCut(cutElement, index) {
    const cut = appState.data.cutscenes[index];

    cutElement.querySelector('[data-action="move-up"]').addEventListener('click', () => moveCut(index, 'up'));
    cutElement.querySelector('[data-action="move-down"]').addEventListener('click', () => moveCut(index, 'down'));
    cutElement.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCut(index));
    cutElement.querySelector('[data-action="view-cut-image"]').addEventListener('click', (e) => {
        const activeShotIndex = parseInt(cutElement.dataset.activeShot || "0");
        showImageModal(cut.shots[activeShotIndex].image, `컷 #${index + 1}, 샷 #${activeShotIndex + 1}`);
    });
    
    cutElement.querySelector('.cut-duration').addEventListener('change', (e) => {
        cut.duration = parseFloat(e.target.value) || 0;
        cut.autoAdjustDuration = false;
        cutElement.querySelector('.auto-adjust-duration').checked = false;
        updateTotalTime();
    });

    cutElement.querySelector('.auto-adjust-duration').addEventListener('change', (e) => {
        cut.autoAdjustDuration = e.target.checked;
        if(cut.autoAdjustDuration) recalculateCutDuration(index, true);
    });
    
    cutElement.querySelectorAll('.shot-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            if (e.target.classList.contains('shot-start-time')) return;
            const shotIndex = e.currentTarget.dataset.shotIndex;
            cutElement.dataset.activeShot = shotIndex;
            
            cutElement.querySelectorAll('.shot-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            cutElement.querySelectorAll('.shot-image').forEach(img => img.classList.remove('active'));
            cutElement.querySelector(`.shot-image[data-shot-index="${shotIndex}"]`).classList.add('active');
            
            cutElement.querySelectorAll('.shot-prompts-container').forEach(p => p.classList.add('hidden'));
            cutElement.querySelector(`.shot-prompts-container[data-shot-index="${shotIndex}"]`).classList.remove('hidden');
        });
    });

    cutElement.querySelectorAll('.shot-start-time').forEach((input) => {
       input.addEventListener('click', (e) => e.stopPropagation());
       input.addEventListener('change', (e) => {
           const shotIndex = parseInt(e.target.closest('.shot-prompts-container').querySelector('.prompt-container').dataset.shotIndex);
           const newTime = parseFloat(e.target.value);
           if (!isNaN(newTime)) {
               cut.shots[shotIndex].startTime = newTime;
               cut.shots.sort((a, b) => a.startTime - b.startTime);
               renderTimeline();
           }
       });
    });

    cutElement.querySelectorAll('.prompt-box-header button').forEach(b => b.addEventListener('click', e => {
        const action = e.currentTarget.dataset.action;
        const promptContainer = e.currentTarget.closest('.prompt-container');
        const type = promptContainer.dataset.type;
        const shotIndex = parseInt(promptContainer.dataset.shotIndex);
        handlePromptAction(action, type, index, shotIndex);
    }));
    
    cutElement.querySelectorAll('.prompt-input').forEach(div => {
       div.addEventListener('click', (e) => handlePromptClick(e));
    });
    
    cutElement.querySelectorAll('.dialogue-controls').forEach((controls, i) => {
        const dialogue = cut.dialogues[i];
        let isGenerating = false;
        const dialogueRow = controls.closest('.bg-gray-800');
        
        dialogueRow.querySelector('.dialogue-start-time').addEventListener('change', (e) => {
           const newTime = parseFloat(e.target.value);
           if (!isNaN(newTime)) {
               dialogue.startTime = newTime;
               cut.dialogues.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
               if (cut.autoAdjustDuration) {
                   recalculateCutDuration(index, true);
               } else {
                   renderTimeline();
               }
           }
        });

        controls.querySelector('.dialogue-copy-btn').addEventListener('click', () => {
           const textToCopy = dialogueRow.querySelector('.dialogue-text').value;
           copyTextToClipboard(textToCopy, showToast);
        });

        controls.querySelector('.dialogue-play-pause-btn').addEventListener('click', () => { if (!isGenerating) playSingleDialogue(dialogue, controls) });
        controls.querySelector('.dialogue-stop-btn').addEventListener('click', () => stopSinglePlayback());
        
        controls.querySelector('.dialogue-refresh-btn').addEventListener('click', async (e) => {
            if (isGenerating) return;
            isGenerating = true;
            const button = e.currentTarget;
            const icon = button.querySelector('i');
            icon.className = 'fas fa-spinner fa-spin';
            button.disabled = true;
            
            const playBtn = dialogueRow.querySelector('.dialogue-play-pause-btn');
            playBtn.disabled = true;

            try {
                const newText = dialogueRow.querySelector('.dialogue-text').value;
                await main.generateAndCacheTTS(dialogue, newText); // main 모듈의 함수 호출
                recalculateCutDuration(index, true); 
            } catch (error) {
                console.error("Refresh TTS failed", error);
                showToast('TTS 생성에 실패했습니다.', 'error');
            } finally {
                isGenerating = false;
                renderTimeline(); 
            }
        });

        controls.querySelector('.dialogue-download-btn').addEventListener('click', () => downloadSingleTTS(dialogue));
    });
}


// --- 모달 및 알림 함수 ---
export function showToast(message, type = 'info') {
    const container = DOM.toastContainer;
    const toast = document.createElement('div');
    const colors = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        error: 'bg-red-600',
    };
    toast.className = `p-4 rounded-lg text-white shadow-lg transition-all duration-300 transform translate-x-full ${colors[type]}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

export function showConfirmModal(title, message, onConfirm) {
    DOM.confirmModalTitle.textContent = title;
    DOM.confirmModalMessage.textContent = message;
    DOM.confirmModal.style.display = 'flex';

    const confirmBtn = DOM.confirmModalConfirm;
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
}

export function closeConfirmModal() {
    DOM.confirmModal.style.display = 'none';
}

export function showImageModal(src, info) { 
    const img = DOM.modalImage;
    img.src = src; 
    img.style.transform = ''; // Reset flip state
    DOM.modalInfo.textContent = info; 
    DOM.imageModal.style.display = 'flex'; 
}

export function closeImageModal() { DOM.imageModal.style.display = 'none'; }

export function flipImageModal() {
    const img = DOM.modalImage;
    img.style.transform = img.style.transform === 'scaleX(-1)' ? '' : 'scaleX(-1)';
}

export function downloadImageModal() {
   const img = DOM.modalImage;
   const info = DOM.modalInfo.textContent;
   const a = document.createElement('a');
   a.href = img.src;
   a.download = `${info.replace(/[:#]/g, '_') || 'image'}.png`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
}

export function showPromptModal(title, content, onSave) {
    const editor = DOM.promptModalEditor;
    editor.innerHTML = formatPromptForEditing(content);
    DOM.promptModalTitle.textContent = title;
    DOM.promptModal.style.display = 'flex';
    if(onSave === null) {
       DOM.promptModalSave.style.display = 'none';
    } else {
       DOM.promptModalSave.style.display = 'inline-block';
       appState._promptSaveHandler = () => onSave(editor);
    }
}

export function closePromptModal() { DOM.promptModal.style.display = 'none'; appState._promptSaveHandler = null; DOM.translationContainer.style.display = 'none'; }


export function showPersonalityModal(character) {
    appState.tempSelectedPersonality = (character.personality || "").split(',').map(t => t.trim()).filter(Boolean);
    const modal = DOM.personalityModal;
    modal.dataset.characterId = character.id;
    DOM.personalityModalTitle.textContent = `'${character.name}' 성격 편집`;
    
    appState.activePersonalityCategory = 0;
    renderPersonalityCategories();
    renderPersonalityTags();
    updatePersonalityTagStates();

    modal.style.display = 'flex';
}

export function closePersonalityModal() { 
    DOM.personalityModal.style.display = 'none'; 
}

function renderPersonalityCategories() {
    const tabsContainer = DOM.personalityCategoryTabs;
    tabsContainer.innerHTML = '';
    if (!appState.personalitySystem.캐릭터) return;
    
    const categories = [...new Set(appState.personalitySystem.캐릭터.map(c => c.카테고리))];

    categories.forEach((categoryName, index) => {
        const tab = document.createElement('button');
        tab.className = 'personality-category-tab px-4 py-2 text-sm rounded-t-lg';
        tab.textContent = categoryName;
        if (index === appState.activePersonalityCategory) {
            tab.classList.add('active');
        }
        tab.onclick = () => {
            appState.activePersonalityCategory = index;
            renderPersonalityCategories();
            renderPersonalityTags();
            updatePersonalityTagStates();
        };
        tabsContainer.appendChild(tab);
    });
}

function renderPersonalityTags() {
    const container = DOM.personalityTagsContainer;
    container.innerHTML = '';
     if (!appState.personalitySystem.캐릭터) return;

    const activeCategoryName = [...new Set(appState.personalitySystem.캐릭터.map(c => c.카테고리))][appState.activePersonalityCategory];
    const keywordsInCategory = appState.personalitySystem.캐릭터.filter(kw => kw.카테고리 === activeCategoryName);

    const pairs = keywordsInCategory.reduce((acc, kw, index) => {
        const pairId = Math.floor(index / 2);
        if (!acc[pairId]) acc[pairId] = [];
        acc[pairId].push(kw);
        return acc;
    }, {});

    Object.values(pairs).forEach(pairKeywords => {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'flex items-center justify-center gap-2';
        pairKeywords.forEach(tagData => {
            const tagEl = document.createElement('span');
            tagEl.className = 'personality-tag px-3 py-2 rounded-full text-sm';
            tagEl.textContent = tagData["성격 키워드"];
            tagEl.dataset.tag = tagData["성격 키워드"];
            if (appState.tempSelectedPersonality.includes(tagData["성격 키워드"])) {
                tagEl.classList.add('selected');
            }
            
            tagEl.addEventListener('click', () => {
                if (tagEl.classList.contains('disabled') && !tagEl.classList.contains('selected')) return;
                
                const tagName = tagEl.dataset.tag;
                const isCurrentlySelected = appState.tempSelectedPersonality.includes(tagName);
                
                if (isCurrentlySelected) {
                    appState.tempSelectedPersonality = appState.tempSelectedPersonality.filter(t => t !== tagName);
                } else {
                    appState.tempSelectedPersonality.push(tagName);
                }
                updatePersonalityTagStates();
            });

            pairDiv.appendChild(tagEl);
        });
        container.appendChild(pairDiv);
    });
}

function updatePersonalityTagStates() {
    if (!appState.personalitySystem.캐릭터 || appState.personalitySystem.캐릭터.length === 0) return;

    const allKeywords = appState.personalitySystem.캐릭터;
    const allKeywordsMap = new Map(allKeywords.map(kw => [kw["성격 키워드"], kw]));
    
    const pairMap = new Map();
    allKeywords.forEach((kw, index) => {
        const pairId = Math.floor(index/2);
        if (!pairMap.has(pairId)) pairMap.set(pairId, []);
        pairMap.get(pairId).push(kw["성격 키워드"]);
    });

    appState.tempSelectedPersonality = appState.tempSelectedPersonality.filter(kw => allKeywordsMap.has(kw));
    
    const categories = [...new Set(allKeywords.map(c => c.카테고리))];
    const selectionsByCategory = categories.map(catName => {
        const catKeywords = new Set(allKeywords.filter(kw => kw.카테고리 === catName).map(kw => kw["성격 키워드"]));
        return appState.tempSelectedPersonality.filter(kw => catKeywords.has(kw)).length;
    });

    const totalSelected = appState.tempSelectedPersonality.length;
    const categoriesWithMinOne = selectionsByCategory.filter(count => count >= 1).length;

    DOM.personalitySelectedCount.textContent = `${totalSelected} / 10 선택됨 (각 카테고리 최소 1개)`;

    const container = DOM.personalityTagsContainer;
    container.querySelectorAll('.personality-tag').forEach(tagEl => {
        tagEl.classList.remove('selected', 'disabled');
        const tag = tagEl.dataset.tag;
        
        if(appState.tempSelectedPersonality.includes(tag)) {
            tagEl.classList.add('selected');
        }
        
        const tagData = allKeywordsMap.get(tag);
        if (!tagData) return;

        let isOppositeSelected = false;
        for(const pair of pairMap.values()){
            if(pair.includes(tag)){
                const opposite = pair.find(t => t !== tag);
                if(appState.tempSelectedPersonality.includes(opposite)){
                    isOppositeSelected = true;
                    break;
                }
            }
        }

        const tagCategoryIndex = categories.indexOf(tagData.카테고리);
        const isCategoryFull = tagCategoryIndex !== -1 && selectionsByCategory[tagCategoryIndex] >= 2;

        if (!tagEl.classList.contains('selected') && (totalSelected >= 10 || isOppositeSelected || isCategoryFull)) {
            tagEl.classList.add('disabled');
        }
    });

    const saveBtn = DOM.personalityModalSave;
    const isSaveable = totalSelected >= 5 && totalSelected <= 10 && categoriesWithMinOne === categories.length;
    saveBtn.disabled = !isSaveable;
}

// --- 유틸리티성 UI 함수 ---

export function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay absolute inset-0 bg-black bg-opacity-70';
    overlay.innerHTML = '<div class="loading-spinner !w-8 !h-8"></div>';
    return overlay;
}

export function formatPromptForEditing(text) { return typeof text !== 'string' ? '' : text.replace(/@([\w\uac00-\ud7a3]+)/g, `<span class="mention" data-mention-name="$1" contenteditable="false">$1</span>&nbsp;`) }

export function parsePromptFromEditing(element) { 
    let text = ""; 
    element.childNodes.forEach(node => { 
        if (node.nodeType === Node.TEXT_NODE) { 
            text += node.textContent; 
        } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mention')) { 
            text += `@${node.dataset.mentionName}`; 
        } 
    }); 
    return text.replace(/\u00A0/g, " ").trim();
}

function handlePromptClick(e) {
    if (e.target.classList.contains('mention')) {
        e.preventDefault();
        showMentionDropdown(e.target);
    }
}

function showMentionDropdown(targetElement) {
    DOM.mentionDropdown.innerHTML = '';
    DOM.mentionDropdown.style.display = 'block';
    const rect = targetElement.getBoundingClientRect();
    DOM.mentionDropdown.style.left = `${rect.left}px`;
    DOM.mentionDropdown.style.top = `${rect.bottom + window.scrollY}px`;

    const characters = appState.data.characters.filter(c => c.id !== 'narrator');
    characters.forEach(char => {
        const item = document.createElement('div');
        item.className = 'p-2 hover:bg-gray-600 cursor-pointer';
        item.textContent = char.name;
        item.onclick = () => {
            targetElement.textContent = char.name;
            targetElement.dataset.mentionName = char.name;
            DOM.mentionDropdown.style.display = 'none';
        };
        DOM.mentionDropdown.appendChild(item);
    });

    const closeDropdown = (event) => {
        if (!DOM.mentionDropdown.contains(event.target) && event.target !== targetElement) {
            DOM.mentionDropdown.style.display = 'none';
            document.removeEventListener('click', closeDropdown);
        }
    };
    setTimeout(() => document.addEventListener('click', closeDropdown), 0);
}

// --- 디버그 콘솔 ---
export function initTTSDebugConsole() {
    DOM.showTTSConsoleBtn.addEventListener('click', () => {
        DOM.ttsDebugConsole.classList.remove('hidden');
        DOM.showTTSConsoleBtn.classList.add('hidden');
    });
    DOM.closeTTSConsoleBtn.addEventListener('click', () => {
        DOM.ttsDebugConsole.classList.add('hidden');
        DOM.showTTSConsoleBtn.classList.remove('hidden');
    });
    DOM.clearTTSConsoleBtn.addEventListener('click', () => {
        DOM.ttsDebugOutput.innerHTML = '';
    });
}

export function logToTTSConsole(title, data, isError = false) {
    if(isError) console.error(title, data);
    else console.log(title, data);

    const logEntry = document.createElement('div');
    logEntry.className = 'p-1 border-b border-gray-700';
    
    let prettyData = '';
    try {
        prettyData = JSON.stringify(data, null, 2);
    } catch (e) {
        prettyData = 'Could not stringify object.';
    }

    const titleColor = isError ? 'text-red-500' : 'text-yellow-400';
    logEntry.innerHTML = `<div class="flex justify-between"><span class="font-bold ${titleColor}">${title}</span><span class="text-green-400">${new Date().toLocaleTimeString()}</span></div><pre class="whitespace-pre-wrap text-gray-300">${prettyData}</pre>`;
    
    DOM.ttsDebugOutput.appendChild(logEntry);
    DOM.ttsDebugOutput.scrollTop = DOM.ttsDebugOutput.scrollHeight;
}

export function populateNarratorVoices(voices) {
    const select = DOM.narratorVoice;
    select.innerHTML = '';
    ['여성', '남성'].forEach(gender => {
        const group = document.createElement('optgroup');
        group.label = gender;
        voices.filter(v => v.gender === gender).forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = formatVoiceForDisplay(voice.name);
            group.appendChild(option);
        });
        select.appendChild(group);
    });
    select.value = 'Charon'; // Default narrator voice
}

function formatVoiceForDisplay(voiceName) {
    const voice = TTS_VOICES.find(v => v.name === voiceName);
    return voice ? `${voice.name} (${voice.gender}, ${voice.desc})` : voiceName;
}

export function updateTotalTime() {
    if (!appState.data.cutscenes) return;
    const total = appState.data.cutscenes.reduce((sum, cut) => sum + (parseFloat(cut.duration) || 0), 0);
    DOM.totalTime.textContent = total.toFixed(1);
}

function updateCharacterDetails(id, newName, newNationality) {
    const character = appState.data.characters.find(c => c.id === id);
    if (!character) return;
    
    const oldName = character.name;
    const nameChanged = oldName !== newName;

    character.name = newName;
    character.nationality = newNationality;

    if (nameChanged) {
        appState.data.cutscenes.forEach(cutscene => {
           cutscene.shots.forEach(shot => {
               const oldRef = `@${oldName}`;
               const newRef = `@${newName}`;
               if(typeof shot.imagePrompt === 'string'){
                   shot.imagePrompt = shot.imagePrompt.split(oldRef).join(newRef);
               }
           });
        });
    }
    
    renderAll();
    showToast(`'${oldName}' 정보가 업데이트되었습니다.`, 'success');
}

