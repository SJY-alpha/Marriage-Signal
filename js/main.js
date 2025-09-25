/**
 * @file js/main.js
 * @description 애플리케이션의 메인 로직 및 시작점(Entry Point)입니다.
 * 각 모듈을 가져와 앱의 상태를 관리하고, 이벤트 핸들러를 등록하며,
 * 전체적인 작업 흐름을 제어합니다.
 */

// 모듈 임포트 (CDN 경로 사용)
import { TTS_VOICES, PERSONALITY_DATA_URL, CURRENT_VERSION } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/constants.js';
import { appState, DOM, cacheDomElements } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/state.js';
import * as api from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/api.js';
import * as ui from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/ui.js';
import * as utils from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/utils.js';

// --- 애플리케이션 초기화 ---

/**
 * 애플리케이션을 초기화하는 메인 함수
 */
async function init() {
    cacheDomElements(); // DOM 요소 캐싱
    await loadInitialData(); // 외부 데이터 로딩
    bindInitialEventListeners(); // 초기 이벤트 리스너 바인딩
    ui.initTTSDebugConsole(); // 디버그 콘솔 초기화
}


/**
 * 외부 데이터를 로드합니다 (예: 성격 데이터).
 */
async function loadInitialData() {
    try {
        const data = await api.loadPersonalityData(PERSONALITY_DATA_URL);
        appState.personalitySystem = data;
        ui.logToTTSConsole('성격 키워드 시스템 로드 성공', `${appState.personalitySystem.캐릭터.length}개의 키워드 그룹 로드됨`);
    } catch (error) {
        ui.logToTTSConsole('성격 키워드 시스템 로드 실패', { error: error.message }, true);
        ui.showToast('성격 시스템 데이터 로드에 실패했습니다. 기능이 제한될 수 있습니다.', 'error');
    } finally {
        ui.populateNarratorVoices(TTS_VOICES); // 데이터 로드 성공/실패와 관계없이 보이스는 채움
    }
}

/**
 * 페이지의 주요 요소에 이벤트 리스너를 바인딩합니다.
 */
function bindInitialEventListeners() {
    DOM.generateStoryBtn.addEventListener('click', generateFullStory);
    DOM.improveScriptBtn.addEventListener('click', improveScript);

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => ui.switchTab(e.currentTarget));
    });
    
    // 모달 관련 이벤트
    DOM.modalClose.addEventListener('click', () => ui.closeImageModal());
    DOM.imageModal.addEventListener('click', (e) => { if(e.target.id === 'image-modal') ui.closeImageModal() });
    DOM.modalFlip.addEventListener('click', () => ui.flipImageModal());
    DOM.modalDownload.addEventListener('click', () => ui.downloadImageModal());

    DOM.promptModalCancel.addEventListener('click', () => ui.closePromptModal());
    DOM.promptModalSave.addEventListener('click', savePrompt);
    
    DOM.personalityModalCancel.addEventListener('click', () => ui.closePersonalityModal());
    DOM.personalityModalSave.addEventListener('click', savePersonality);

    DOM.timelinePlay.addEventListener('click', () => playTimeline());
    DOM.timelinePause.addEventListener('click', () => pauseTimeline());
    DOM.timelineStop.addEventListener('click', () => stopTimeline());
    DOM.saveProjectBtn.addEventListener('click', () => utils.saveProject());
    DOM.loadProjectBtn.addEventListener('click', () => DOM.fileLoader.click());
    DOM.fileLoader.addEventListener('change', async (e) => {
        try {
            const loadedState = await utils.loadProject(e.target.files[0]);
            appState.data = loadedState;
            ui.renderAll();
            DOM.editorSection.classList.remove("hidden");
            DOM.initialSettings.classList.add("hidden");
            ui.showToast("프로젝트를 성공적으로 불러왔습니다.", 'success');
        } catch (error) {
             console.error("Project load failed:", error);
             ui.showToast(`프로젝트 불러오기에 실패했습니다: ${error.message}`, 'error');
        }
    });
    DOM.playerClose.addEventListener('click', () => stopTimeline());
    DOM.downloadAllAudioBtn.addEventListener('click', () => downloadAllTTS());

    // Narrator controls
    const updateNarratorSetting = (key, value) => {
        let narrator = appState.data.characters?.find(c => c.id === 'narrator');
        if (!narrator && appState.data.characters) {
            narrator = { id: 'narrator', name: '나레이션' };
            appState.data.characters.push(narrator);
        }
        if (narrator) {
            narrator[key] = value;
        }
    };

    DOM.narratorVoice.addEventListener('change', (e) => updateNarratorSetting('voice', e.target.value));
    DOM.narratorPitchSlider.addEventListener('input', (e) => {
         const value = parseFloat(e.target.value);
         updateNarratorSetting('pitch', value);
         DOM.narratorPitchValue.textContent = value.toFixed(2);
    });
    DOM.narratorSpeedSlider.addEventListener('input', (e) => {
         const value = parseFloat(e.target.value);
         updateNarratorSetting('speed', value);
         DOM.narratorSpeedValue.textContent = value.toFixed(2);
    });
    DOM.narratorVoicePreview.addEventListener('click', (e) => {
        const narrator = appState.data.characters?.find(c => c.id === 'narrator');
        if (narrator) {
           previewTTSVoice({ voice: narrator.voice || 'Charon', speed: narrator.speed || 1.0, pitch: narrator.pitch || 0.0 }, e.currentTarget);
        }
    });
    DOM.narratorApplyAll.addEventListener('click', () => applyTtsSettingsToTimeline('narrator'));
                                
    DOM.confirmModalCancel.addEventListener('click', () => ui.closeConfirmModal());
    DOM.confirmModal.addEventListener('click', (e) => { if (e.target.id === 'confirm-modal') ui.closeConfirmModal() });
}

// --- 핵심 로직 및 이벤트 핸들러 ---

async function generateFullStory() {
    DOM.initialSettings.classList.add('hidden');
    DOM.loadingIndicator.style.display = 'flex';
    let currentStep = 1;
    const totalSteps = 4;

    const updateLoadingMessage = (message) => {
        DOM.loadingMessage.textContent = `${message}... ⏳ (${currentStep}/${totalSteps})`;
        currentStep++;
    };

    try {
        updateLoadingMessage('AI가 시나리오와 캐릭터를 창작하고 있습니다');
        const keywords = DOM.keywords.value;
        const duration = DOM.duration.value;
        const script = DOM.scriptInput.value;
        let storyData = await api.generateStoryAPI(keywords, duration, script);
        
        if (!storyData || !storyData.characters || !storyData.cutscenes) {
           throw new Error("API로부터 유효한 시나리오 데이터를 받지 못했습니다. 데이터 구조를 확인해주세요.");
        }
        
        storyData.cutscenes.forEach(cut => {
            cut.autoAdjustDuration = cut.autoAdjustDuration ?? true;
            if (cut.imagePrompt && !cut.shots) {
                cut.shots = [{ shotId: 1, imagePrompt: cut.imagePrompt, videoPrompt: cut.videoPrompt, startTime: 0, image: null }];
                delete cut.imagePrompt; delete cut.videoPrompt; delete cut.image;
            }
            cut.shots = cut.shots || [];
             cut.shots.forEach(shot => {
                shot.startTime = shot.startTime ?? 0;
            });
            cut.dialogues.forEach(d => {
                d.audioSrc = null; d.cachedBlobUrl = null; d.pcmData = null; d.audioDuration = null;
                d.startTime = d.startTime ?? 0;
                d.postDelay = d.postDelay ?? (Math.random() * 0.9 + 0.1);
                d.ttsPrompt = d.ttsPrompt || '';
            });
        });
        appState.data = storyData;
        
        if (appState.data.characters) {
            const narrator = appState.data.characters.find(c => c.id === 'narrator');
            if (narrator) {
                narrator.pitch = narrator.pitch ?? 0.0;
                narrator.speed = narrator.speed ?? 1.0;
                narrator.voice = narrator.voice ?? 'Charon';
            }
            appState.data.characters.forEach(char => {
                if(!char.nationality) char.nationality = "한국";
                if (char.id !== 'narrator') {
                    applyPersonality(char);
                }
            });
        }

        updateLoadingMessage('레퍼런스 이미지를 생성하고 있습니다');
        await generateAllReferenceImages();

        updateLoadingMessage('컷신 이미지를 생성하고 있습니다');
        await generateAllShotImages();

        updateLoadingMessage('대사 음성을 생성하고 있습니다');
        await generateAllTTS();
        
        await intelligentlySetAllTimings();

        DOM.loadingIndicator.style.display = 'none';
        ui.renderAll();
        DOM.editorSection.classList.remove('hidden');

    } catch (error) {
        console.error("전체 스토리 생성 실패:", error);
        DOM.loadingIndicator.style.display = 'none';
        DOM.initialSettings.classList.remove('hidden');
        ui.showToast(`시나리오 생성에 실패했습니다: ${error.message}`, 'error');
    }
}

async function improveScript() {
    const improveBtn = DOM.improveScriptBtn;
    const scriptTextarea = DOM.scriptInput;
    
    improveBtn.disabled = true;
    improveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> 개선 중...`;
    
    try {
        const originalScript = scriptTextarea.value;
        if (!originalScript.trim()) {
             ui.showToast('개선할 대본을 먼저 입력해주세요.', 'info');
        } else {
            const keywords = DOM.keywords.value;
            const improvedScript = await api.improveScriptAPI(originalScript, keywords);
            scriptTextarea.value = improvedScript;
            ui.showToast('AI가 대본을 개선했습니다!', 'success');
        }
    } catch (error) {
        console.error("대본 개선 실패:", error);
        ui.showToast('대본 개선에 실패했습니다.', 'error');
    } finally {
        improveBtn.disabled = false;
        improveBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles mr-1"></i> AI 대본 개선`;
    }
}

function applyPersonality(character) {
    const keywords = (character.personality || "").split(',').map(t => t.trim()).filter(Boolean);
    if (keywords.length === 0) return;

    const characterGender = character.gender;
    const genderKey = characterGender === '남성' ? '남성' : '여성';

    const selectedMappings = appState.personalitySystem.캐릭터
        .filter(mapping => keywords.includes(mapping['성격 키워드']) && mapping[genderKey])
        .map(mapping => mapping[genderKey]);

    if (selectedMappings.length === 0) {
        console.warn(`No matching personality mappings for character ${character.name} with gender ${characterGender} and keywords: ${keywords.join(', ')}`);
        return;
    }

    const chosenMapping = selectedMappings[Math.floor(Math.random() * selectedMappings.length)];

    character.voice = chosenMapping.보이스;
    character.tts_tone = chosenMapping.톤;
    character.pitch = chosenMapping.Pitch;
    character.speed = chosenMapping['Speaking Rate'];

    const { 옵션풀 } = appState.personalitySystem;
    const genderedOptionPool = 옵션풀[genderKey] || 옵션풀;
    const randomChoice = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : '';

    const appearanceParts = [
        chosenMapping['기본 외모'],
        randomChoice(genderedOptionPool['눈']),
        randomChoice(genderedOptionPool['입']),
        randomChoice(genderedOptionPool['코']),
        randomChoice(genderedOptionPool['눈썹']),
        randomChoice(genderedOptionPool['몸매'])
    ].filter(Boolean); 

    const fashion = randomChoice(chosenMapping['패션']);
    const hair = randomChoice(chosenMapping['헤어']);

    const basePrompt = `A ${character.nationality} ${character.gender === '남성' ? 'man' : 'woman'} in his 30s, ${appearanceParts.join(', ')}. Wearing ${fashion}. Hair is ${hair}. photorealistic, cinematic lighting.`;
    character.prompt = basePrompt;
}

async function generateAllReferenceImages() {
    if (!appState.data.characters || !appState.data.backgrounds) return;
    const imagePromises = [];
    const callApi = (item) => api.generateImageForCut(item, {}, {}, utils.forceAspect).then(img => { item.image = img; });

    for (const item of appState.data.characters) {
        if (item.id === 'narrator') continue;
        imagePromises.push(callApi(item));
    }
     for (const item of appState.data.backgrounds) {
        imagePromises.push(callApi(item));
    }
    await Promise.all(imagePromises);
}

async function generateAllShotImages() {
    if (!appState.data.cutscenes) return;
    const characterReferenceImages = Object.fromEntries(appState.data.characters.filter(c => c.image).map(c => [c.name, c.image]));
    const locationReferenceImages = Object.fromEntries(appState.data.backgrounds.filter(b => b.image).map(b => [b.name, b.image]));

    const allShots = appState.data.cutscenes.flatMap(cutscene => cutscene.shots);

    for (const shot of allShots) {
         shot.image = await api.generateImageForCut(shot, characterReferenceImages, locationReferenceImages, utils.forceAspect);
         await new Promise(resolve => setTimeout(resolve, 500)); 
    }
}

async function generateAllTTS() {
    if (!appState.data.cutscenes) return;
    const allDialogues = appState.data.cutscenes.flatMap(cut => cut.dialogues);
    for (const dialogue of allDialogues) {
        await generateAndCacheTTS(dialogue, dialogue.text);
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
    }
}

function getTtsPromptForDialogue(dialogue) {
    let baseText = (dialogue.text || "").trim();
    let whisperMode = false;

    if (baseText.includes('(속으로)')) {
        baseText = baseText.replace(/\(속으로\)/g, '').trim();
        whisperMode = true;
    }

    const character = appState.data.characters.find(c => c.id === dialogue.charId);
    
    let basePrompt;
    if (whisperMode) {
        basePrompt = "Whisper this secretly";
    } else {
        basePrompt = (character && character.tts_tone) 
            ? character.tts_tone 
            : (dialogue.ttsPrompt || "Say this clearly");
    }

    if (dialogue.charId === 'narrator') {
        basePrompt = "Say this in a clear, informative tone";
    }

    if (!character) {
        return `${basePrompt}: "${baseText}"`;
    }

    let instructions = [basePrompt];

    const speed = character.speed || 1.0;
    if (Math.abs(speed - 1.0) > 0.01) {
        instructions.push(`at a speed of ${speed.toFixed(2)}x`);
    }
    
    const pitch = character.pitch || 0.0;
    if (pitch > 1.5) instructions.push("with a very high pitch");
    else if (pitch > 0.7) instructions.push("with a high pitch");
    else if (pitch < -1.5) instructions.push("with a very low pitch");
    else if (pitch < -0.7) instructions.push("with a low pitch");
    
    const finalPrompt = instructions.join(', ');
    return `${finalPrompt}: "${baseText}"`;
}

export async function generateAndCacheTTS(dialogue, text) {
     if (!dialogue) return false;
     let newText = text !== null ? text : dialogue.text;
     
     if (newText.includes('(속으로)')) {
        newText = newText.replace(/\(속으로\)/g, '').trim();
     }
     dialogue.text = newText;


     if (!newText || !newText.trim()) {
         dialogue.audioDuration = 0;
         dialogue.pcmData = null;
         if (dialogue.cachedBlobUrl) URL.revokeObjectURL(dialogue.cachedBlobUrl);
         dialogue.cachedBlobUrl = null;
         return true;
     }

     if (dialogue.cachedBlobUrl) URL.revokeObjectURL(dialogue.cachedBlobUrl);
    
     let success = false;
     try {
         const character = appState.data.characters.find(c => c.id === dialogue.charId);
         if (!character) {
            ui.logToTTSConsole('TTS 생성 실패: 캐릭터 없음', { '캐릭터 ID': dialogue.charId, '대사': newText }, true);
            throw new Error(`Character with id ${dialogue.charId} not found.`);
         }

         ui.logToTTSConsole('TTS 생성 시작', { '대사': newText, '캐릭터': character.name });
         
         const ttsPrompt = getTtsPromptForDialogue(dialogue);
         const voice = character.voice || 'Kore';
         
         ui.logToTTSConsole('API 요청 데이터', {'프롬프트': ttsPrompt, '보이스': voice });

         const base64Audio = await api.generateTTSAPI(ttsPrompt, voice);

         ui.logToTTSConsole('✅ TTS 생성 성공', {});
         
         const pcmBuffer = utils.base64ToArrayBuffer(base64Audio);
         dialogue.pcmData = new Int16Array(pcmBuffer);
         dialogue.audioDuration = (dialogue.pcmData.length / 24000);
         const wavBlob = utils.pcmToWav(pcmBuffer, 24000);
         dialogue.cachedBlobUrl = URL.createObjectURL(wavBlob);
         success = true;

     } catch (error) {
         ui.logToTTSConsole('TTS 생성 최종 실패', { '대사': newText, '오류': error.message }, true);
         success = false;
     }
    
     if (!success) dialogue.audioDuration = null;
     return success;
}

// --- Timeline & Playback ---

function playTimeline() {
    if (appState.playbackState.isPlaying) return;
    stopSinglePlayback();
    appState.playbackState.isPlaying = true;
    appState.playbackState.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    DOM.timelinePlay.classList.add('hidden');
    DOM.timelinePause.classList.remove('hidden');
    DOM.videoPlayerModal.style.display = 'flex';

    if (appState.playbackState.currentAbsTime >= parseFloat(DOM.totalTime.textContent)) {
        appState.playbackState.currentAbsTime = 0;
    }
    appState.playbackState.startTime = appState.playbackState.audioContext.currentTime - appState.playbackState.currentAbsTime;
    scheduleAudio();
    
    appState.playbackState.intervalId = setInterval(() => updatePlaybackFrame(), 100);
}

function pauseTimeline() {
    if (!appState.playbackState.isPlaying) return;
    appState.playbackState.isPlaying = false;
    clearInterval(appState.playbackState.intervalId);
    appState.playbackState.audioSources.forEach(source => source.stop());
    appState.playbackState.audioSources = [];
    if (appState.playbackState.audioContext) {
        appState.playbackState.audioContext.close();
        appState.playbackState.audioContext = null;
    }
    DOM.timelinePlay.classList.remove('hidden');
    DOM.timelinePause.classList.add('hidden');
}

function stopTimeline() {
    pauseTimeline();
    appState.playbackState.currentAbsTime = 0;
    DOM.videoPlayerModal.style.display = 'none';
    updatePlaybackFrame();
    document.querySelectorAll('.cutscene-card.playing').forEach(c => c.classList.remove('playing'));
}

function scheduleAudio() {
    let cumulativeTime = 0;
    appState.data.cutscenes.forEach(cut => {
        cut.dialogues.forEach(dialogue => {
           const dialogueStartTime = dialogue.startTime || 0;
            if (dialogue.cachedBlobUrl) {
                const absStartTime = cumulativeTime + dialogueStartTime;
                if (absStartTime >= appState.playbackState.currentAbsTime) {
                    fetch(dialogue.cachedBlobUrl)
                        .then(response => response.arrayBuffer())
                        .then(arrayBuffer => appState.playbackState.audioContext.decodeAudioData(arrayBuffer))
                        .then(audioBuffer => {
                            if (!appState.playbackState.isPlaying) return;
                            const source = appState.playbackState.audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(appState.playbackState.audioContext.destination);
                            source.start(appState.playbackState.startTime + absStartTime);
                            appState.playbackState.audioSources.push(source);
                        });
                }
            }
        });
        cumulativeTime += parseFloat(cut.duration) || 0;
    });
}

function updatePlaybackFrame() {
    if (appState.playbackState.isPlaying) {
       appState.playbackState.currentAbsTime = appState.playbackState.audioContext.currentTime - appState.playbackState.startTime;
    }
    
    if (appState.playbackState.currentAbsTime >= parseFloat(DOM.totalTime.textContent)) {
        return stopTimeline();
    }

    DOM.currentTime.textContent = appState.playbackState.currentAbsTime.toFixed(1);
    let cutStartTime = 0;
    let activeCutIndex = -1;
    let activeShotIndex = -1;

    for (let i = 0; i < appState.data.cutscenes.length; i++) {
        const duration = parseFloat(appState.data.cutscenes[i].duration) || 0;
        if (appState.playbackState.currentAbsTime >= cutStartTime && appState.playbackState.currentAbsTime < cutStartTime + duration) {
            activeCutIndex = i;
            const cutRelativeTime = appState.playbackState.currentAbsTime - cutStartTime;
            const activeShot = appState.data.cutscenes[i].shots.slice().reverse().find(shot => cutRelativeTime >= shot.startTime);
            activeShotIndex = activeShot ? appState.data.cutscenes[i].shots.indexOf(activeShot) : 0;
            break;
        }
        cutStartTime += duration;
    }

    if (activeCutIndex !== appState.playbackState.currentCutIndex || activeShotIndex !== appState.playbackState.currentShotIndex) {
        appState.playbackState.currentCutIndex = activeCutIndex;
        appState.playbackState.currentShotIndex = activeShotIndex;

        document.querySelectorAll(".cutscene-card.playing").forEach(c => c.classList.remove("playing"));
        if (activeCutIndex !== -1) {
            const card = DOM.timelineContainer.querySelector(`.cutscene-card[data-index="${activeCutIndex}"]`);
            if (card) {
                card.classList.add("playing");
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const shot = appState.data.cutscenes[activeCutIndex].shots[activeShotIndex];
                DOM.playerImage.src = shot.image;
            }
        }
    }

    const subtitlesContainer = DOM.playerSubtitlesContainer;
    subtitlesContainer.innerHTML = "";
    if (activeCutIndex !== -1 && DOM.showSubtitles.checked) {
        const cut = appState.data.cutscenes[activeCutIndex];
        const cutAbsStartTime = appState.data.cutscenes.slice(0, activeCutIndex).reduce((acc, c) => acc + (parseFloat(c.duration) || 0), 0);
        
        for(const dialogue of cut.dialogues){
            const dialogueAbsStartTime = cutAbsStartTime + (dialogue.startTime || 0);
            const dialogueAbsEndTime = dialogueAbsStartTime + (dialogue.audioDuration || 0);

             if (appState.playbackState.currentAbsTime >= dialogueAbsStartTime && appState.playbackState.currentAbsTime < dialogueAbsEndTime) {
                const character = appState.data.characters.find(c => c.id === dialogue.charId);
                const charName = character ? character.name : "Unknown";
                const p = document.createElement("p");
                p.className = "video-player-subtitle text-white font-bold";
                const charColor = charName === "나레이션" ? "text-yellow-300" : "text-cyan-300";
                p.innerHTML = `<span class="${charColor}">${charName}:</span> ${dialogue.text}`;
                subtitlesContainer.appendChild(p);
                break; 
             }
        }
    }
}

// --- UI Interaction Handlers (Exported for ui.js) ---
// The functions below are exported so they can be attached as event listeners
// to dynamically created elements in ui.js.

export function stopSinglePlayback() {
    if (appState.singlePlayback.audio) {
        appState.singlePlayback.audio.pause();
        appState.singlePlayback.audio = null;
    }
    if (appState.singlePlayback.controlsElement) {
        const btn = appState.singlePlayback.controlsElement.querySelector('.dialogue-play-pause-btn i');
        const isAudioReady = appState.singlePlayback.dialogue?.cachedBlobUrl;
        if (isAudioReady) {
            btn.className = 'fas fa-volume-up text-green-400';
        } else {
            btn.className = 'fas fa-play';
        }
        appState.singlePlayback.controlsElement.querySelector('.dialogue-stop-btn').classList.add('hidden');
        appState.singlePlayback.controlsElement = null;
        appState.singlePlayback.dialogue = null;
    }
}

export async function playSingleDialogue(dialogue, controlsElement) {
    const playPauseBtn = controlsElement.querySelector('.dialogue-play-pause-btn');

    if (appState.singlePlayback.audio && appState.singlePlayback.dialogue === dialogue) {
        if (appState.singlePlayback.audio.paused) {
            appState.singlePlayback.audio.play();
        } else {
            appState.singlePlayback.audio.pause();
        }
        return;
    }
    stopSinglePlayback();

    appState.singlePlayback.controlsElement = controlsElement;
    appState.singlePlayback.dialogue = dialogue;
    const stopBtn = controlsElement.querySelector('.dialogue-stop-btn');

    try {
        const audioUrl = dialogue.cachedBlobUrl;
        if (!audioUrl) throw new Error("음성 데이터가 없습니다. 먼저 생성해주세요.");
        
        appState.singlePlayback.audio = new Audio(audioUrl);
        const icon = playPauseBtn.querySelector('i');
        
        appState.singlePlayback.audio.onplay = () => {
            icon.className = 'fas fa-pause';
            stopBtn.classList.remove('hidden');
        };
        appState.singlePlayback.audio.onpause = () => {
           if (appState.singlePlayback.audio && appState.singlePlayback.audio.currentTime < appState.singlePlayback.audio.duration) {
                icon.className = 'fas fa-play';
           }
        };
        appState.singlePlayback.audio.onended = () => {
            stopSinglePlayback();
        };
        
        appState.singlePlayback.audio.play();

    } catch (error) {
        console.error("오디오 재생 실패:", error);
        ui.showToast(error.message, 'error');
        stopSinglePlayback();
    }
}

export async function downloadSingleTTS(dialogue) {
    if (!dialogue.pcmData) {
         ui.showToast("음성 데이터가 없습니다.", 'error');
         return;
    }
    const mp3Blob = await utils.convertPcmToMp3Blob(dialogue.pcmData);
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = utils.sanitizeFilename(dialogue.text) + ".mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadAllTTS() {
    const btn = DOM.downloadAllAudioBtn;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...`;
    const zip = new JSZip();
    const filenames = new Set();
    for (const cut of appState.data.cutscenes) {
        for (const dialogue of cut.dialogues) {
            if (dialogue.pcmData) {
                const mp3Blob = await utils.convertPcmToMp3Blob(dialogue.pcmData);
                let baseFilename = utils.sanitizeFilename(dialogue.text);
                let finalFilename = `${baseFilename}.mp3`;
                let count = 1;
                while (filenames.has(finalFilename)) finalFilename = `${baseFilename}_${count++}.mp3`;
                filenames.add(finalFilename);
                zip.file(finalFilename, mp3Blob);
            }
        }
    }
    zip.generateAsync({ type: "blob" }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "all_dialogues.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-archive mr-2"></i>모든 음성 저장`;
}

export function moveCut(index, direction) {
    if (direction === 'up' && index > 0) {
        [appState.data.cutscenes[index], appState.data.cutscenes[index - 1]] = [appState.data.cutscenes[index - 1], appState.data.cutscenes[index]];
    } else if (direction === 'down' && index < appState.data.cutscenes.length - 1) {
        [appState.data.cutscenes[index], appState.data.cutscenes[index + 1]] = [appState.data.cutscenes[index + 1], appState.data.cutscenes[index]];
    }
    ui.renderTimeline();
}

export function deleteCut(index) {
    ui.showConfirmModal(
        '컷 삭제',
        `#${index + 1} 컷을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        () => {
            appState.data.cutscenes.splice(index, 1);
            ui.renderTimeline();
            ui.showToast('컷이 삭제되었습니다.', 'info');
        }
    );
}

export async function handlePromptAction(action, type, cutIndex, shotIndex) {
    const cutscene = appState.data.cutscenes[cutIndex];
    const shot = cutscene.shots[shotIndex];
    const promptElement = DOM.timelineContainer.querySelector(`[data-index="${cutIndex}"] [data-shot-index="${shotIndex}"][data-type="${type}"] .prompt-input`);
    
    switch(action) {
        case 'copy': 
            const textToCopy = ui.parsePromptFromEditing(promptElement);
            utils.copyTextToClipboard(textToCopy, ui.showToast);
            break;
        case 'edit': 
            const promptText = ui.parsePromptFromEditing(promptElement);
            ui.showPromptModal(`${type === 'imagePrompt' ? '이미지' : '영상'} 프롬프트 편집`, promptText, (newPromptEditor) => {
                const newPromptText = ui.parsePromptFromEditing(newPromptEditor);
                if (type === 'imagePrompt') {
                    shot.imagePrompt = newPromptText;
                } else if(shot.videoPrompt) {
                    if(shot.videoPrompt.type === 'hailuo') shot.videoPrompt.prompt = newPromptText;
                    else shot.videoPrompt.tip = newPromptText;
                }
                ui.renderTimeline();
            });
            break;
        case 'regenerate':
            if (type === 'imagePrompt') {
                shot.imagePrompt = ui.parsePromptFromEditing(promptElement);
                const cutElement = DOM.timelineContainer.querySelector(`.cutscene-card[data-index="${cutIndex}"]`);
                const imgContainer = cutElement.querySelector('.cutscene-image-container');
                const overlay = ui.createLoadingOverlay();
                imgContainer.appendChild(overlay);
                const charRefs = Object.fromEntries(appState.data.characters.filter(c=>c.image).map(c => [c.name, c.image]));
                const locRefs = Object.fromEntries(appState.data.backgrounds.filter(b=>b.image).map(b => [b.name, b.image]));
                shot.image = await api.generateImageForCut(shot, charRefs, locRefs, utils.forceAspect);
                imgContainer.removeChild(overlay);
                ui.renderTimeline();
            } else { ui.showToast('영상 프롬프트/팁은 직접 수정해주세요.', 'info'); }
            break;
        case 'translate':
            if(shot.videoPrompt && shot.videoPrompt.type === 'hailuo') {
                DOM.translationContainer.textContent = "번역 중...";
                DOM.translationContainer.style.display = 'block';
                ui.showPromptModal('Hailuo 프롬프트 번역', shot.videoPrompt.prompt, null);
                try {
                    const translatedText = await api.translateTextAPI(shot.videoPrompt.prompt);
                    DOM.translationContainer.textContent = translatedText;
                } catch (e) {
                    DOM.translationContainer.textContent = "번역에 실패했습니다.";
                }
            }
            break;
    }
}

export async function previewTTSVoice(options, buttonElement) {
    const { voice, speed = 1.0, pitch = 0.0 } = options;
    const cacheKey = `${voice}_${pitch}`; // Cache based on voice and pitch
    const icon = buttonElement.querySelector('i');

    if (appState.ttsPreviewAudio.audio && !appState.ttsPreviewAudio.audio.paused && appState.ttsPreviewAudio.button === buttonElement) {
        appState.ttsPreviewAudio.audio.pause();
        return;
    }
     if (appState.ttsPreviewAudio.audio) {
        appState.ttsPreviewAudio.audio.pause();
        if(appState.ttsPreviewAudio.button) {
           appState.ttsPreviewAudio.button.querySelector('i').className = 'fas fa-play';
        }
    }


    buttonElement.disabled = true;
    icon.className = 'fas fa-spinner fa-spin';

    try {
        let audioUrl;
        if (appState.ttsPreviewAudio.cache[cacheKey]) {
            audioUrl = appState.ttsPreviewAudio.cache[cacheKey];
        } else {
           let instructions = [];
          
           if (pitch > 1.5) instructions.push("with a very high pitch");
           else if (pitch > 0.7) instructions.push("with a high pitch");
           else if (pitch < -1.5) instructions.push("with a very low pitch");
           else if (pitch < -0.7) instructions.push("with a low pitch");
           
           const prompt = `Say this ${instructions.join(', ')}: "안녕하세요, 결혼시그널 제작소입니다."`;
            const base64Audio = await api.generateTTSAPI(prompt, voice);
            const pcmBuffer = utils.base64ToArrayBuffer(base64Audio);
            const wavBlob = utils.pcmToWav(pcmBuffer, 24000);
            audioUrl = URL.createObjectURL(wavBlob);
            appState.ttsPreviewAudio.cache[cacheKey] = audioUrl;
        }
        
        appState.ttsPreviewAudio.audio = new Audio(audioUrl);
        appState.ttsPreviewAudio.button = buttonElement;
        appState.ttsPreviewAudio.audio.playbackRate = speed;

        appState.ttsPreviewAudio.audio.onplay = () => {
            icon.className = 'fas fa-pause';
            buttonElement.disabled = false;
        };
        appState.ttsPreviewAudio.audio.onpause = () => {
            icon.className = 'fas fa-play';
        };
         appState.ttsPreviewAudio.audio.onended = () => {
            icon.className = 'fas fa-play';
            appState.ttsPreviewAudio.audio = null;
            appState.ttsPreviewAudio.button = null;
        };

        appState.ttsPreviewAudio.audio.play();

    } catch (error) {
        console.error("TTS preview failed:", error);
        ui.showToast('미리듣기 생성에 실패했습니다.', 'error');
        buttonElement.disabled = false;
        icon.className = 'fas fa-play';
    } 
}

export async function applyTtsSettingsToTimeline(charId, showToast = true) {
   const character = appState.data.characters.find(c => c.id === charId);
   if (!character) return;
   
   if(showToast) ui.showToast(`'${character.name}'의 음성 설정을 모든 대사에 적용합니다...`, 'info');
   
   for (const cut of appState.data.cutscenes) {
       for (const dialogue of cut.dialogues) {
           if (dialogue.charId === charId) {
               await generateAndCacheTTS(dialogue, dialogue.text);
               await new Promise(resolve => setTimeout(resolve, 300));
           }
       }
   }

   recalculateAllCutDurations(true);
   if(showToast) ui.showToast(`'${character.name}'의 음성 설정이 모두 적용되었습니다.`, 'success');
}

export async function savePersonality() {
    const charId = DOM.personalityModal.dataset.characterId;
    const character = appState.data.characters.find(c => c.id === charId);
    if (character) {
        character.personality = appState.tempSelectedPersonality.join(', ');
        
        applyPersonality(character);
        
        ui.closePersonalityModal();

        ui.showToast(`'${character.name}'의 성격에 맞춰 AI가 프롬프트를 재구성하고 이미지를 다시 생성합니다...`, 'info');
        character.prompt = await api.refineCharacterPromptAPI(character);
        const card = DOM.characterReferences.querySelector(`[data-character-id="${charId}"]`);
        if (card) {
            const imgElement = card.querySelector('img');
            const container = imgElement.parentElement;
            const overlay = ui.createLoadingOverlay();
            container.appendChild(overlay);
            character.image = await api.generateImageForCut(character, {}, {}, utils.forceAspect);
            container.removeChild(overlay);
        }
        
        ui.renderCharacters();
        ui.showToast(`'${character.name}'의 성격이 저장되었습니다. '전체 적용'을 눌러 모든 컷에 반영하세요.`, 'success');
    } else {
        ui.closePersonalityModal();
    }
}

export function savePrompt() { 
    if (appState._promptSaveHandler) {
        appState._promptSaveHandler();
    }
    ui.closePromptModal(); 
}

export async function applyReferenceToAll(charId) {
    const character = appState.data.characters.find(c => c.id === charId);
    if (!character) return;
    ui.showToast(`'${character.name}'의 설정을 모든 컷씬에 적용합니다...`, 'info');

    await regenerateCutscenesForReference(character.name);
    await applyTtsSettingsToTimeline(charId, false);
    recalculateAllCutDurations(true);
    ui.showToast(`'${character.name}'의 설정이 모두 적용되었습니다.`, 'success');
}

async function regenerateCutscenesForReference(refName) {
    const characterReferenceImages = Object.fromEntries(appState.data.characters.filter(c=>c.image).map(c => [c.name, c.image]));
    const locationReferenceImages = Object.fromEntries(appState.data.backgrounds.filter(b=>b.image).map(b => [b.name, b.image]));
    const referenceRegex = new RegExp(`@${refName}`);

    for (const cut of appState.data.cutscenes) {
       for (const shot of cut.shots) {
           if (typeof shot.imagePrompt === 'string' && referenceRegex.test(shot.imagePrompt)) {
               shot.image = await api.generateImageForCut(shot, characterReferenceImages, locationReferenceImages, utils.forceAspect);
               ui.renderTimeline(); 
               await new Promise(resolve => setTimeout(resolve, 300));
           }
       }
    }
}

async function intelligentlySetAllTimings() {
    if (!appState.data.cutscenes) return;
    for (const cut of appState.data.cutscenes) {
        intelligentlySetTimings(cut);
    }
    recalculateAllCutDurations(true);
}

function intelligentlySetTimings(cut) {
   if (!cut.dialogues || cut.dialogues.length === 0) return;
   
   let lastDialogueEndTime = 0;
   cut.dialogues.forEach(dialogue => {
       dialogue.startTime = lastDialogueEndTime;
       lastDialogueEndTime += (dialogue.audioDuration || 0) + (dialogue.postDelay || 0);
   });

   cut.shots.forEach((shot, shotIndex) => {
       if (shotIndex === 0) {
           shot.startTime = 0;
           return;
       }
       const mentionedCharNames = (shot.imagePrompt.match(/@([\w\uac00-\ud7a3]+)/g) || []).map(m => m.substring(1));
       const mentionedCharIds = appState.data.characters
           .filter(c => mentionedCharNames.includes(c.name))
           .map(c => c.id);

       const firstDialogueTime = cut.dialogues
           .filter(d => mentionedCharIds.includes(d.charId))
           .map(d => d.startTime)
           .sort((a,b) => a - b)[0];

       shot.startTime = firstDialogueTime !== undefined ? firstDialogueTime : (cut.shots[shotIndex-1].startTime || 0);
   });
   cut.shots.sort((a,b) => a.startTime - b.startTime);
}

function recalculateAllCutDurations(forceRerender = false) {
    if (!appState.data.cutscenes) return;
    appState.data.cutscenes.forEach((cut, index) => {
        recalculateCutDuration(index);
    });
    if (forceRerender) {
        ui.renderTimeline();
    }
    ui.updateTotalTime();
}

export function recalculateCutDuration(cutIndex, forceRerender = false) {
    const cut = appState.data.cutscenes[cutIndex];
    if (!cut || !cut.dialogues) return;
    
    if (cut.autoAdjustDuration) {
        const allDialoguesHaveDuration = cut.dialogues.every(d => d.audioDuration !== null && d.audioDuration !== undefined);
        if (!allDialoguesHaveDuration) return;

        cut.dialogues.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

        let lastEndTime = 0;
        if (cut.dialogues.length > 0) {
           const lastDialogue = cut.dialogues[cut.dialogues.length - 1];
           lastEndTime = (lastDialogue.startTime || 0) + (lastDialogue.audioDuration || 0) + (lastDialogue.postDelay || 0);
        }
        
        cut.duration = parseFloat(lastEndTime.toFixed(1));
    }

    ui.updateTotalTime();
    if (forceRerender) ui.renderTimeline();
}


// --- 애플리케이션 시작 ---
document.addEventListener('DOMContentLoaded', init);

