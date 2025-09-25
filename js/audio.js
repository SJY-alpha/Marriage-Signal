import { state } from './app.js';
import { generateTTSAPI } from './api.js';
import { logToTTSConsole, showToast, recalculateAllCutDurations } from './ui.js';
import { base64ToArrayBuffer, pcmToWav, sanitizeFilename } from './utils.js';

export function getTtsPromptForDialogue(dialogue) {
    let baseText = (dialogue.text || "").trim();
    let whisperMode = false;

    if (baseText.includes('(속으로)')) {
        baseText = baseText.replace(/\(속으로\)/g, '').trim();
        whisperMode = true;
    }

    const character = state.story.characters.find(c => c.id === dialogue.charId);
    
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
         const character = state.story.characters.find(c => c.id === dialogue.charId);
         if (!character) {
            logToTTSConsole('TTS 생성 실패: 캐릭터 없음', { '캐릭터 ID': dialogue.charId, '대사': newText }, true);
            throw new Error(`Character with id ${dialogue.charId} not found.`);
         }

         logToTTSConsole('TTS 생성 시작', { '대사': newText, '캐릭터': character.name });
         
         const ttsPrompt = getTtsPromptForDialogue(dialogue);
         const voice = character.voice || 'Kore';
         
         logToTTSConsole('API 요청 데이터', {'프롬프트': ttsPrompt, '보이스': voice });

         const base64Audio = await generateTTSAPI(ttsPrompt, voice);

         logToTTSConsole('✅ TTS 생성 성공', {});
         
         const pcmBuffer = base64ToArrayBuffer(base64Audio);
         dialogue.pcmData = new Int16Array(pcmBuffer);
         dialogue.audioDuration = (dialogue.pcmData.length / 24000);
         const wavBlob = pcmToWav(pcmBuffer, 24000);
         dialogue.cachedBlobUrl = URL.createObjectURL(wavBlob);
         success = true;

     } catch (error) {
         logToTTSConsole('TTS 생성 최종 실패', { '대사': newText, '오류': error.message }, true);
         success = false;
     }
    
     if (!success) dialogue.audioDuration = null;
     return success;
}

export async function previewTTSVoice(options, buttonElement) {
    const { voice, speed = 1.0, pitch = 0.0 } = options;
    const cacheKey = `${voice}_${pitch}`;
    const icon = buttonElement.querySelector('i');

    if (state.ttsPreviewAudio.audio && !state.ttsPreviewAudio.audio.paused && state.ttsPreviewAudio.button === buttonElement) {
        state.ttsPreviewAudio.audio.pause();
        return;
    }
     if (state.ttsPreviewAudio.audio) {
        state.ttsPreviewAudio.audio.pause();
        if(state.ttsPreviewAudio.button) {
           state.ttsPreviewAudio.button.querySelector('i').className = 'fas fa-play';
        }
    }

    buttonElement.disabled = true;
    icon.className = 'fas fa-spinner fa-spin';

    try {
        let audioUrl;
        if (state.ttsPreviewAudio.cache[cacheKey]) {
            audioUrl = state.ttsPreviewAudio.cache[cacheKey];
        } else {
           let instructions = [];
          
           if (pitch > 1.5) instructions.push("with a very high pitch");
           else if (pitch > 0.7) instructions.push("with a high pitch");
           else if (pitch < -1.5) instructions.push("with a very low pitch");
           else if (pitch < -0.7) instructions.push("with a low pitch");
           
           const prompt = `Say this ${instructions.join(', ')}: "안녕하세요, 결혼시그널 제작소입니다."`;
            const base64Audio = await generateTTSAPI(prompt, voice);
            const pcmBuffer = base64ToArrayBuffer(base64Audio);
            const wavBlob = pcmToWav(pcmBuffer, 24000);
            audioUrl = URL.createObjectURL(wavBlob);
            state.ttsPreviewAudio.cache[cacheKey] = audioUrl;
        }
        
        state.ttsPreviewAudio.audio = new Audio(audioUrl);
        state.ttsPreviewAudio.button = buttonElement;
        state.ttsPreviewAudio.audio.playbackRate = speed;

        state.ttsPreviewAudio.audio.onplay = () => {
            icon.className = 'fas fa-pause';
            buttonElement.disabled = false;
        };
        state.ttsPreviewAudio.audio.onpause = () => {
            icon.className = 'fas fa-play';
        };
         state.ttsPreviewAudio.audio.onended = () => {
            icon.className = 'fas fa-play';
            state.ttsPreviewAudio.audio = null;
            state.ttsPreviewAudio.button = null;
        };

        state.ttsPreviewAudio.audio.play();

    } catch (error) {
        console.error("TTS preview failed:", error);
        showToast('미리듣기 생성에 실패했습니다.', 'error');
        buttonElement.disabled = false;
        icon.className = 'fas fa-play';
    } 
}

export async function convertPcmToMp3Blob(pcmData) {
    return new Promise(resolve => {
        if (!pcmData) { resolve(null); return; }
        const mp3Encoder = new lamejs.Mp3Encoder(1, 24000, 128);
        const samples = pcmData;
        const sampleBlockSize = 1152;
        const mp3Data = [];
        for (let i = 0; i < samples.length; i += sampleBlockSize) {
            const sampleChunk = samples.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
            if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
        }
        const mp3buf = mp3Encoder.flush();
        if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
        resolve(new Blob(mp3Data, { type: 'audio/mpeg' }));
    });
}

export async function downloadAllTTS() {
    const btn = document.getElementById('download-all-audio-btn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...`;
    const zip = new JSZip();
    const filenames = new Set();
    for (const cut of state.story.cutscenes) {
        for (const dialogue of cut.dialogues) {
            if (dialogue.pcmData) {
                const mp3Blob = await convertPcmToMp3Blob(dialogue.pcmData);
                let baseFilename = sanitizeFilename(dialogue.text).replace('.mp3', '');
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

export async function downloadSingleTTS(dialogue) {
    if (!dialogue.pcmData) {
         showToast("음성 데이터가 없습니다.", 'error');
         return;
    }
    const mp3Blob = await convertPcmToMp3Blob(dialogue.pcmData);
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(dialogue.text) + '.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
