import { state } from './app.js';
import { DOM_ELEMENTS } from './config.js';

export function stopSinglePlayback() {
    if (state.singlePlayback.audio) {
        state.singlePlayback.audio.pause();
        state.singlePlayback.audio = null;
    }
    if (state.singlePlayback.controlsElement) {
        const btn = state.singlePlayback.controlsElement.querySelector('.dialogue-play-pause-btn i');
        const audioReady = state.singlePlayback.dialogue?.cachedBlobUrl;
        btn.className = `fas ${audioReady ? "fa-volume-up text-green-400" : "fa-play"}`;
        
        state.singlePlayback.controlsElement.querySelector('.dialogue-stop-btn').classList.add('hidden');
        state.singlePlayback.controlsElement = null;
        state.singlePlayback.dialogue = null;
    }
}

export async function playSingleDialogue(dialogue, controlsElement) {
    const playPauseBtn = controlsElement.querySelector('.dialogue-play-pause-btn');

    if (state.singlePlayback.audio && state.singlePlayback.dialogue === dialogue) {
        if (state.singlePlayback.audio.paused) {
            state.singlePlayback.audio.play();
        } else {
            state.singlePlayback.audio.pause();
        }
        return;
    }
    stopSinglePlayback();

    state.singlePlayback.controlsElement = controlsElement;
    state.singlePlayback.dialogue = dialogue;
    const stopBtn = controlsElement.querySelector('.dialogue-stop-btn');

    try {
        const audioUrl = dialogue.cachedBlobUrl;
        if (!audioUrl) throw new Error("음성 데이터가 없습니다. 먼저 생성해주세요.");
        
        state.singlePlayback.audio = new Audio(audioUrl);
        const icon = playPauseBtn.querySelector('i');
        
        state.singlePlayback.audio.onplay = () => {
            icon.className = 'fas fa-pause';
            stopBtn.classList.remove('hidden');
        };
        state.singlePlayback.audio.onpause = () => {
           if (state.singlePlayback.audio && state.singlePlayback.audio.currentTime < state.singlePlayback.audio.duration) {
                icon.className = 'fas fa-play';
           }
        };
        state.singlePlayback.audio.onended = () => {
            stopSinglePlayback();
        };
        
        state.singlePlayback.audio.play();

    } catch (error) {
        console.error("오디오 재생 실패:", error);
        const { showToast } = await import('./ui.js');
        showToast(error.message, 'error');
        stopSinglePlayback();
    }
}

function scheduleAudio() {
    let cumulativeTime = 0;
    state.story.cutscenes.forEach(cut => {
        cut.dialogues.forEach(dialogue => {
           const dialogueStartTime = dialogue.startTime || 0;
            if (dialogue.cachedBlobUrl) {
                const absStartTime = cumulativeTime + dialogueStartTime;
                if (absStartTime >= state.playbackState.currentAbsTime) {
                    fetch(dialogue.cachedBlobUrl)
                        .then(response => response.arrayBuffer())
                        .then(arrayBuffer => state.playbackState.audioContext.decodeAudioData(arrayBuffer))
                        .then(audioBuffer => {
                            if (!state.playbackState.isPlaying) return;
                            const source = state.playbackState.audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(state.playbackState.audioContext.destination);
                            source.start(state.playbackState.startTime + absStartTime);
                            state.playbackState.audioSources.push(source);
                        });
                }
            }
        });
        cumulativeTime += parseFloat(cut.duration) || 0;
    });
}

function updatePlaybackFrame() {
    if (state.playbackState.isPlaying) {
       state.playbackState.currentAbsTime = state.playbackState.audioContext.currentTime - state.playbackState.startTime;
    }
    
    if (state.playbackState.currentAbsTime >= parseFloat(DOM_ELEMENTS.totalTimeDisplay.textContent)) {
        return stopTimeline();
    }

    DOM_ELEMENTS.currentTimeDisplay.textContent = state.playbackState.currentAbsTime.toFixed(1);
    let cutStartTime = 0;
    let activeCutIndex = -1;
    let activeShotIndex = -1;

    for (let i = 0; i < state.story.cutscenes.length; i++) {
        const duration = parseFloat(state.story.cutscenes[i].duration) || 0;
        if (state.playbackState.currentAbsTime >= cutStartTime && state.playbackState.currentAbsTime < cutStartTime + duration) {
            activeCutIndex = i;
            const cutRelativeTime = state.playbackState.currentAbsTime - cutStartTime;
            const activeShot = state.story.cutscenes[i].shots.slice().reverse().find(shot => cutRelativeTime >= shot.startTime);
            activeShotIndex = activeShot ? state.story.cutscenes[i].shots.indexOf(activeShot) : 0;
            break;
        }
        cutStartTime += duration;
    }

    if (activeCutIndex !== state.playbackState.currentCutIndex || activeShotIndex !== state.playbackState.currentShotIndex) {
        state.playbackState.currentCutIndex = activeCutIndex;
        state.playbackState.currentShotIndex = activeShotIndex;

        document.querySelectorAll(".cutscene-card.playing").forEach(c => c.classList.remove("playing"));
        if (activeCutIndex !== -1) {
            const card = DOM_ELEMENTS.timelineContainer.querySelector(`.cutscene-card[data-index="${activeCutIndex}"]`);
            if (card) {
                card.classList.add("playing");
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const shot = state.story.cutscenes[activeCutIndex].shots[activeShotIndex];
                document.getElementById("player-image").src = shot.image;
            }
        }
    }

    const subtitlesContainer = document.getElementById("player-subtitles-container");
    subtitlesContainer.innerHTML = "";
    if (activeCutIndex !== -1 && document.getElementById("show-subtitles").checked) {
        const cut = state.story.cutscenes[activeCutIndex];
        const cutAbsStartTime = state.story.cutscenes.slice(0, activeCutIndex).reduce((acc, c) => acc + (parseFloat(c.duration) || 0), 0);
        
        for(const dialogue of cut.dialogues){
            const dialogueAbsStartTime = cutAbsStartTime + (dialogue.startTime || 0);
            const dialogueAbsEndTime = dialogueAbsStartTime + (dialogue.audioDuration || 0);

             if (state.playbackState.currentAbsTime >= dialogueAbsStartTime && state.playbackState.currentAbsTime < dialogueAbsEndTime) {
                const character = state.story.characters.find(c => c.id === dialogue.charId);
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

export function playTimeline() {
    if (state.playbackState.isPlaying) return;
    stopSinglePlayback();
    state.playbackState.isPlaying = true;
    state.playbackState.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    document.getElementById('timeline-play').classList.add('hidden');
    document.getElementById('timeline-pause').classList.remove('hidden');
    DOM_ELEMENTS.videoPlayerModal.style.display = 'flex';

    if (state.playbackState.currentAbsTime >= parseFloat(DOM_ELEMENTS.totalTimeDisplay.textContent)) {
        state.playbackState.currentAbsTime = 0;
    }
    state.playbackState.startTime = state.playbackState.audioContext.currentTime - state.playbackState.currentAbsTime;
    scheduleAudio();
    
    state.playbackState.intervalId = setInterval(() => updatePlaybackFrame(), 100);
}

export function pauseTimeline() {
    if (!state.playbackState.isPlaying) return;
    state.playbackState.isPlaying = false;
    clearInterval(state.playbackState.intervalId);
    state.playbackState.audioSources.forEach(source => source.stop());
    state.playbackState.audioSources = [];
    if (state.playbackState.audioContext) {
        state.playbackState.audioContext.close();
        state.playbackState.audioContext = null;
    }
    document.getElementById('timeline-play').classList.remove('hidden');
    document.getElementById('timeline-pause').classList.add('hidden');
}

export function stopTimeline() {
    pauseTimeline();
    state.playbackState.currentAbsTime = 0;
    DOM_ELEMENTS.videoPlayerModal.style.display = 'none';
    updatePlaybackFrame();
    document.querySelectorAll('.cutscene-card.playing').forEach(c => c.classList.remove('playing'));
}
