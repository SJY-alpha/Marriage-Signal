import { state } from './app.js';
import { generateTTSAPI } from './api.js';
import { logToTTSConsole, showToast } from './ui.js';
import { base64ToArrayBuffer, pcmToWav, sanitizeFilename } from './utils.js';

export function getTtsPromptForDialogue(dialogue) {
    // ... 원본 getTtsPromptForDialogue 함수 내용
    let baseText = (dialogue.text || "").trim();
    // ...
    return `${finalPrompt}: "${baseText}"`;
}

export async function generateAndCacheTTS(dialogue, text) {
    // ... 원본 generateAndCacheTTS 함수 내용
    try {
        const character = state.story.characters.find(c => c.id === dialogue.charId);
        // ...
        const base64Audio = await generateTTSAPI(ttsPrompt, voice);
        // ...
        return true;
    } catch (error) {
        // ...
        return false;
    }
}

export async function previewTTSVoice(options, buttonElement) {
    // ... 원본 previewTTSVoice 함수 내용
    try {
        // ...
        const base64Audio = await generateTTSAPI(prompt, voice);
        // ...
    } catch (error) {
        // ...
    }
}

export async function downloadAllTTS() {
    // ... 원본 downloadAllTTS 함수 내용
}

export async function downloadSingleTTS(dialogue) {
    // ... 원본 downloadSingleTTS 함수 내용
}

export async function convertPcmToMp3Blob(pcmData) {
    // ... 원본 convertPcmToMp3Blob 함수 내용
}
