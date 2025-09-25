export function sanitizeFilename(text) {
    if (!text) return "untitled.mp3";
    return text.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
}

export function forceAspect(dataUrl, ratio = '9:16') {
    // ... 원본 forceAspect 함수 내용
}

export function base64ToArrayBuffer(base64) {
    // ... 원본 base64ToArrayBuffer 함수 내용
}

export function pcmToWav(pcmBuffer, sampleRate) {
    // ... 원본 pcmToWav 함수 내용
}

export function writeString(view, offset, string) {
    // ... 원본 writeString 함수 내용
}

export function copyTextToClipboard(text) {
    // ... 원본 copyTextToClipboard 함수 내용
}

export async function blobToBase64(blob) {
    // ... 원본 blobToBase64 함수 내용
}

export async function wavBlobToArrayBuffer(blob) {
    // ... 원본 wavBlobToArrayBuffer 함수 내용
}
