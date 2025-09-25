export function sanitizeFilename(text) {
    if (!text) return "untitled.mp3";
    return text.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
}

export function forceAspect(dataUrl, ratio = '9:16') {
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

 export function base64ToArrayBuffer(base64) {
     const binaryString = window.atob(base64);
     const len = binaryString.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
         bytes[i] = binaryString.charCodeAt(i);
     }
     return bytes.buffer;
 }
 
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

 export function writeString(view, offset, string) {
     for (let i = 0; i < string.length; i++) {
         view.setUint8(offset + i, string.charCodeAt(i));
     }
 }

export function copyTextToClipboard(text) {
    const { showToast } = import('./ui.js');
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

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function wavBlobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.slice(44)); 
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}
