import { DOM_ELEMENTS } from './config.js';
import { logToTTSConsole } from './ui.js';

async function callAPI(apiUrl, payload, modelName) {
    const apiKey = ""; // 필요한 경우 API 키를 여기에 추가
    let finalUrl = apiUrl;
    if (apiKey) {
        finalUrl += `?key=${apiKey}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    try {
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            let errorText = await response.text();
            const errorInfo = {
                status: response.status,
                statusText: response.statusText,
                responseText: errorText,
                requestPayload: payload
            };
            if (modelName === 'TTS') logToTTSConsole(`[ERROR] API Error: ${modelName}`, errorInfo, true);
            throw new Error(`[${modelName}] API Error ${response.status}: ${errorText}`);
        }
        return await response.json();

    } catch (error) {
        const errorInfo = {
             error: error.message,
             requestPayload: payload
        };
        if (modelName === 'TTS') logToTTSConsole(`[FATAL] API Call Failed: ${modelName}`, errorInfo, true);
        throw error;
    }
}

export async function generateStoryAPI(keywords, duration, script) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
    const systemPrompt = `You are a team of 8 world-class AI experts building a script for 'Marriage Signal', a YouTube Shorts drama...`; // 원본 시스템 프롬프트 전체 내용
    const userPrompt = `주제 키워드: "${keywords}", 영상 길이: ${duration}초.\n\n참고 대본/사연:\n${script}`;
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
    };
    const result = await callAPI(apiUrl, payload, "Story Generation");
    if (!result || !result.candidates || !result.candidates[0].content?.parts?.[0]?.text) {
        console.error("Invalid response structure from Story API:", result);
        throw new Error("스토리 API로부터 유효하지 않은 응답을 받았습니다.");
    }
    return JSON.parse(result.candidates[0].content.parts[0].text);
}

export async function refineCharacterPromptAPI(character) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
    const systemPrompt = `You are an expert image prompt writer...`; // 원본 시스템 프롬프트
    const userPrompt = `Base Prompt: "${character.prompt}"\nPersonality Keywords: "${character.personality}"\n...`; // 원본 사용자 프롬프트
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    const result = await callAPI(apiUrl, payload, "Prompt Refinement");
    if (result && result.candidates && result.candidates[0].content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    return character.prompt; // Fallback
}

export async function generateImageAPI(prompt, characterReferences = {}, locationReferences = {}) {
    let finalPrompt = prompt.replace(/@[\w\uac00-\ud7a3]+/g, (match, p1) => p1).trim();
    // ... 기타 프롬프트 처리 로직
    const textPrompt = `Photorealistic image of ${finalPrompt}...`;
    const parts = [{ text: textPrompt }];
    // ... 참조 이미지 처리 로직

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`;
    const payload = { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } };
    const result = await callAPI(apiUrl, payload, "Image Generation");
    const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (base64Data) {
        return `data:image/png;base64,${base64Data}`;
    }
    throw new Error('No image data from API');
}

export async function improveScriptAPI(originalScript, keywords) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
    const systemPrompt = `You are South Korea's top Shorts drama scriptwriter...`; // 원본 시스템 프롬프트
    const userPrompt = `주제 키워드: "${keywords}"\n\n---원본 대본---\n${originalScript}`;
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    const result = await callAPI(apiUrl, payload, "Script Improvement");
    if (!result || !result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("대본 개선 API로부터 유효하지 않은 응답을 받았습니다.");
    }
    return result.candidates[0].content.parts[0].text;
}

export async function generateTTSAPI(text, voice = 'Kore') {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`;
    const payload = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
        }
    };
    const result = await callAPI(apiUrl, payload, "TTS");
    const part = result?.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) return part.inlineData.data;
    throw new Error("TTS API did not return audio data.");
}

export async function translateTextAPI(text) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
    const payload = {
        contents: [{ parts: [{ text: `Translate the following English text to Korean: "${text}"` }] }]
    };
    const result = await callAPI(apiUrl, payload, "Translation");
    return result.candidates[0].content.parts[0].text;
}
