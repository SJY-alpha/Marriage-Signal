/**
 * @file js/utils.js
 * @description 오디오 처리, 프로젝트 저장/불러오기, 텍스트 처리 등 범용적인 유틸리티 함수를 관리합니다.
 */

// --- 오디오 처리 유틸리티 ---

/** Base64 문자열을 ArrayBuffer로 변환합니다. */
export function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/** PCM 오디오 데이터를 WAV Blob으로 변환합니다. */
export function pcmToWav(pcmBuffer, sampleRate) {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const pcm16 = new Int16Array(pcmBuffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcm16.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcm16.length * 2, true);
    return new Blob([view, pcm16], { type: 'audio/wav' });
}

/** DataView에 문자열을 씁니다. (pcmToWav 헬퍼) */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/** PCM 데이터를 MP3 Blob으로 변환합니다. */
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


// --- 프로젝트 저장/불러오기 유틸리티 ---

/** 현재 프로젝트를 JSON 파일로 저장합니다. */
export async function saveProject(state, version, keywords) {
    // ... (원본 코드의 saveProject 함수 내용)
}

/** JSON 파일을 불러와 프로젝트를 로드합니다. */
export async function loadProject(file) {
    // ... (원본 코드의 loadProject 함수 내용)
}

/** 이전 버전의 프로젝트 데이터를 최신 버전으로 마이그레이션합니다. */
function migrateProjectData(data, currentVersion) {
    // ... (원본 코드의 migrateProjectData 함수 내용)
}


// --- 기타 유틸리티 ---

/** 파일명으로 사용할 수 없는 문자를 제거합니다. */
export function sanitizeFilename(text) {
    if (!text) return "untitled.mp3";
    return text.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
}

/** 이미지의 가로세로 비율을 강제로 조정합니다. */
export async function forceAspect(dataUrl, ratio = '9:16') {
    // ... (원본 코드의 forceAspect 함수 내용)
}

/** 텍스트를 클립보드에 복사합니다. */
export function copyTextToClipboard(text, showToast) {
    // ... (원본 코드의 copyTextToClipboard 함수 내용, showToast를 인자로 받음)
}
