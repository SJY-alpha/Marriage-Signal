/**
 * @file js/utils.js
 * @description 애플리케이션 전반에서 사용되는 헬퍼 함수들을 포함합니다.
 * (오디오 처리, 파일 저장/로드, 텍스트 복사 등)
 */
import { appState } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/state.js';
import { CURRENT_VERSION } from 'https://cdn.jsdelivr.net/gh/SJY-alpha/Marriage-Signal@527845707204c5eb7b87f283e8615ab2ce1d50bd/js/constants.js';

/**
 * 이미지 비율을 강제로 조정합니다.
 * @param {string} dataUrl - 원본 이미지의 Data URL
 * @param {string} ratio - '9:16'과 같은 비율 문자열
 * @returns {Promise<string>} 비율이 조정된 이미지의 Data URL
 */
export async function forceAspect(dataUrl, ratio = '9:16') {
    return new Promise((resolve) => {
        const [rw, rh] = ratio.split(':').map(Number);
        const targetW = 1080, targetH = Math.round(targetW * rh / rw);
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, targetW, targetH);

            const sRatio = img.width / img.height;
            const tRatio = targetW / targetH;

            let dw, dh, dx, dy;
            if (sRatio > tRatio) { 
                dh = targetH;
                dw = dh * sRatio;
                dx = (targetW - dw) / 2;
                dy = 0;
            } else { 
                dw = targetW;
                dh = dw / sRatio;
                dx = 0;
                dy = (targetH - dh) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            resolve(`https://placehold.co/${targetW}x${targetH}/374151/9ca3af?text=Load+Error`);
        };
        img.src = dataUrl;
    });
}

/**
 * Base64 문자열을 ArrayBuffer로 변환합니다.
 * @param {string} base64 - Base64로 인코딩된 문자열
 * @returns {ArrayBuffer} 변환된 ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * PCM 오디오 데이터를 WAV 형식의 Blob으로 변환합니다.
 * @param {ArrayBuffer} pcmBuffer - 원본 PCM 데이터
 * @param {number} sampleRate - 샘플링 레이트 (예: 24000)
 * @returns {Blob} WAV 형식의 Blob 객체
 */
export function pcmToWav(pcmBuffer, sampleRate) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const pcm16 = new Int16Array(pcmBuffer);
    
    // RIFF 헤더
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcm16.length * 2, true);
    writeString(view, 8, 'WAVE');
    
    // fmt 청크
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, 1, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // data 청크
    writeString(view, 36, 'data');
    view.setUint32(40, pcm16.length * 2, true);
    
    return new Blob([view, pcm16], { type: 'audio/wav' });
}

/**
 * DataView의 특정 오프셋에 문자열을 씁니다.
 * @param {DataView} view - 데이터를 쓸 DataView 객체
 * @param {number} offset - 시작 오프셋
 * @param {string} string - 쓸 문자열
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * PCM 데이터를 MP3 형식의 Blob으로 변환합니다.
 * @param {Int16Array} pcmData - 16비트 PCM 데이터
 * @returns {Promise<Blob>} MP3 형식의 Blob 객체
 */
export async function convertPcmToMp3Blob(pcmData) {
    return new Promise(resolve => {
        if (!pcmData) { resolve(null); return; }
        const mp3Encoder = new lamejs.Mp3Encoder(1, 24000, 128); // 1-channel, 24000Hz, 128kbps
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

/**
 * 파일 이름으로 사용할 수 없는 문자를 제거합니다.
 * @param {string} text - 원본 텍스트
 * @returns {string} 안전한 파일 이름
 */
export function sanitizeFilename(text) {
    if (!text) return "untitled";
    return text.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
}


/**
 * 텍스트를 클립보드에 복사합니다.
 * @param {string} text - 복사할 텍스트
 * @param {function} showToast - 결과를 표시할 토스트 함수
 */
export function copyTextToClipboard(text, showToast) {
   const textArea = document.createElement("textarea");
   textArea.value = text;
   textArea.style.position = "fixed";
   textArea.style.left = "-9999px";
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   try {
       document.execCommand('copy');
       showToast('복사되었습니다.', 'success');
   } catch (err) {
       showToast('복사에 실패했습니다.', 'error');
   }
   document.body.removeChild(textArea);
}

// --- 프로젝트 저장 및 로드 ---

/**
 * 현재 프로젝트 상태를 JSON 파일로 저장합니다.
 */
export async function saveProject() {
    const btn = document.getElementById('save-project-btn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...`;
    try {
        const saveData = JSON.parse(JSON.stringify(appState.data));
        saveData.version = CURRENT_VERSION;
        for (const cut of saveData.cutscenes) {
            for (const dialogue of cut.dialogues) {
                if (dialogue.cachedBlobUrl) {
                    dialogue.audioData_base64 = await blobToBase64(await fetch(dialogue.cachedBlobUrl).then(r => r.blob()));
                }
                delete dialogue.pcmData;
                delete dialogue.cachedBlobUrl;
            }
        }
        const jsonString = JSON.stringify(saveData);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const keywords = document.getElementById("keywords").value.replace(/[\\/:*?"<>|]/g, "_").substring(0, 30);
        a.download = `결혼시그널_${keywords || 'project'}_v${CURRENT_VERSION}.json`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        // showToast('프로젝트가 성공적으로 저장되었습니다.', 'success');
    } catch (error) {
        console.error("Project save failed:", error);
        // showToast('프로젝트 저장에 실패했습니다.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save mr-2"></i>저장`;
    }
}

/**
 * JSON 파일을 로드하여 프로젝트 상태를 복원합니다.
 * @param {File} file - 로드할 파일 객체
 * @returns {Promise<object>} 로드된 상태 객체
 */
export function loadProject(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("No file selected"));
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let loadedState = JSON.parse(e.target.result);
                loadedState = migrateProjectData(loadedState);
                for (const cut of loadedState.cutscenes) {
                    for (const dialogue of cut.dialogues) {
                        if (dialogue.audioData_base64) {
                            const blob = await (await fetch(dialogue.audioData_base64)).blob();
                            dialogue.cachedBlobUrl = URL.createObjectURL(blob);
                            const pcmBuffer = await wavBlobToArrayBuffer(blob);
                            dialogue.pcmData = new Int16Array(pcmBuffer);
                            delete dialogue.audioData_base64;
                        }
                    }
                }
                resolve(loadedState);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (e) => reject(new Error("File reading failed"));
        reader.readAsText(file);
    });
}


/**
 * 이전 버전의 프로젝트 데이터를 최신 버전으로 마이그레이션합니다.
 * @param {object} data - 로드된 프로젝트 데이터
 * @returns {object} 마이그레이션된 데이터
 */
function migrateProjectData(data) {
   const version = parseFloat(data.version) || 1.0;
   if (version < 1.4) {
       data.cutscenes.forEach(cut => {
           if (cut.imagePrompt && !cut.shots) {
               cut.shots = [{ shotId: 1, imagePrompt: cut.imagePrompt, videoPrompt: cut.videoPrompt, startTime: 0, image: cut.image || null }];
               delete cut.imagePrompt;
               delete cut.videoPrompt;
               delete cut.image;
           }
       });
    }
    data.version = CURRENT_VERSION;
    return data;
}

/**
 * WAV Blob에서 헤더를 제외한 순수 PCM ArrayBuffer를 추출합니다.
 * @param {Blob} blob - WAV 형식의 Blob
 * @returns {Promise<ArrayBuffer>} PCM 데이터 ArrayBuffer
 */
function wavBlobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.slice(44)); // 44바이트 WAV 헤더 건너뛰기
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Blob을 Base64 Data URL로 변환합니다.
 * @param {Blob} blob - 변환할 Blob 객체
 * @returns {Promise<string>} Base64 Data URL
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

