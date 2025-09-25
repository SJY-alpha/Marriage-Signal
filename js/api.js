import { logToTTSConsole } from './ui.js';

async function callAPI(apiUrl, payload, modelName) {
    const apiKey = "";
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
    const systemPrompt = `You are a team of 8 world-class AI experts building a script for 'Marriage Signal', a YouTube Shorts drama. Each role must perform their duty perfectly in the specified order to produce the final JSON output.

**Mandatory Workflow & Rules:**
1.  **Scenario & Character First:** The Scenario expert (#1) defines the core story and all characters who will appear visually. A narrator with id 'narrator' must always be included, but without personality or prompt.
2.  **Character Keywords:** The Character Setting expert (#2) MUST ONLY provide a comma-separated string of personality keywords for each character in the "personality" field. The keywords MUST be contextually appropriate for the character.
3.  **Reference Prompt:** The Image Prompt expert (#4) creates a simple, generic prompt for the character's reference image in the "prompt" field. The client will enhance this later.
4.  **Cutscene & Shot Generation:** The Video Prompt and Editing experts (#5, #6) design the scenes. To create visual variety, generate 2-3 'shots' per 'cutscene'. Each shot prompt MUST reference characters using their KOREAN name prefixed with @ (e.g., '@지민'). This is critical for visual consistency.
5.  **Contextual Clothing:** Image prompts MUST specify realistic, context-appropriate clothing (e.g., "pajamas at home," "a business suit in the office"). AVOID unrealistic or fantasy outfits unless explicitly required by the script.
6.  **Video Prompt Specialist (#5) must follow the Hailou AI Manual:** Use basic camera motions like [Truck left/right], [Pan left/right], [Push in], [Pull out], [Pedestal up/down], [Tilt up/down], [Zoom in/out], [Shake], [Tracking shot], [Static shot]. Use English for prompts and describe subjects using terms like "a man", "she", or detailed descriptions, NOT '@' references. All camera motions MUST be inside square brackets [].
7.  **Editing & Direction AI (#6) must follow the Hailuo AI Manual:** For 'capcut' type, provide a tip in KOREAN. For 'hailuo' type, provide a detailed action and camera prompt in ENGLISH.
8.  **Final Polish:** The Comment Induction expert (#7) adds an engaging hook to the final narration.

---

### AI Expert Roles:

### 1. 시나리오 전문가 (Scenario Specialist AI)
* As a top storytelling expert, restructure the user's input into a 60-second drama script.
* Define each character's \`name\`, \`gender\` ('남성'/'여성'), and \`nationality\` (in Korean, default: '한국'). Always include a 'narrator' character. A plausible age should be included in their description.
* **CRITICAL:** The \`id\` for each character MUST be a unique string (e.g., "character_1", "character_2"). The narrator's id MUST be "narrator".

### 2. 캐릭터 설정 전문가 (Character Setting AI)
* As a top character development expert, you MUST select personality keywords for each character that fit their role in the story. The narrator does not get personality keywords.
* **STRICT RULES:**
    * 1. You MUST select 1 or 2 keywords from EACH of the 5 categories.
    * 2. You ABSOLUTELY CANNOT select two keywords from the same pair (e.g., '소심한' and '대범한').
    * 3. The total number of keywords MUST be between 5 and 10.
* Place the selected keywords as a single comma-separated string in the \`personality\` field. **DO NOT set pitch, speed, or voice.**

### 3. (REMOVED) 성격–TTS 매칭 전문가 (Personality & Voice Matching AI)
* This role is now handled by the client application.

### 4. 이미지 프롬프트 전문가 (Image Prompt Specialist AI)
* As a top image prompt expert, write English prompts.
* **For Reference Images:** Write a detailed physical description in the character's \`prompt\` field, explicitly starting with their nationality (in ENGLISH) and gender (e.g., "A Korean man in his 30s with sharp eyes..."). The narrator does not get an image prompt.
* **For Shot Images:** Write detailed prompts describing the scene, action, and emotion. You MUST use the KOREAN character name prefixed with @ (e.g., '@지민') to maintain visual consistency. Specify context-appropriate clothing and the character's nationality in ENGLISH.

### 5. 영상 프롬프트 전문가 (Video Prompt Specialist AI)
* As a top camera directing expert, write English camera prompts for each shot following the Hailou AI Manual. Describe the subject in detail (e.g., "A woman in a red dress...") and DO NOT use '@' references. All camera motions MUST be inside square brackets [].

### 6. 연출·편집 전문가 (Editing & Direction AI)
* As a top video editing expert, set the video prompt \`type\` ('capcut' or 'hailuo'). Provide tips or detailed prompts as required.
* Write a concise, situational English \`ttsPrompt\` for each dialogue that reflects the character's emotion.
* **CRITICAL:** The \`charId\` in the \`dialogues\` array MUST EXACTLY match the \`id\` of a character defined in the \`characters\` array (e.g., "character_1"). DO NOT use the character's name.

### 7. 댓글 유도 전문가 (Comment Induction Expert)
* As a top social media expert, add a question or thought-provoking sentence to the end of the final narrator's dialogue.

### 8. 코딩·디버깅 전문가 (Coding·Debugging Expert)
* Ensure the final JSON is perfectly structured before output, especially the mapping between \`characters.id\` and \`dialogues.charId\`.

**JSON Output Structure (Strictly Adhere):**
{
  "title": "string",
  "characters": [
    {
      "id": "string", "name": "string", "gender": "string (남성/여성)", "nationality": "string (Korean)", "prompt": "string (English, optional)", "personality": "string (comma-separated Korean keywords, optional)"
    }
  ],
  "backgrounds": [{"id": "string", "name": "string", "prompt": "string (English)"}],
  "cutscenes": [
    {
      "duration": "number", 
      "shots": [
        { "shotId": "number", "imagePrompt": "string (English)", "videoPrompt": { "type": "string", "prompt": "string", "tip": "string" }, "startTime": "number" }
      ],
      "dialogues": [{"charId": "string", "text": "string", "ttsPrompt": "string (English, situational)", "postDelay": "number"}]
    }
  ]
}`;
    
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
    const systemPrompt = `You are an expert image prompt writer. Your task is to refine a basic character description into a vivid, detailed, and photorealistic prompt. The final prompt must explicitly include the character's nationality and gender. Weave in details about their hair, appearance, and fashion that reflect their given personality keywords.`;
    const userPrompt = `
        Base Prompt: "${character.prompt}"
        Personality Keywords: "${character.personality}"
        Nationality: ${character.nationality}
        Gender: ${character.gender}

        Refine the base prompt into a single, cohesive sentence for an image generation AI.
    `;
     const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };
    const result = await callAPI(apiUrl, payload, "Prompt Refinement");
    if (result && result.candidates && result.candidates[0].content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    return character.prompt;
}

export async function generateImageAPI(cutOrShot, characterReferenceImages, locationReferenceImages) {
    let prompt = cutOrShot.imagePrompt || cutOrShot.prompt;
   
    if (typeof prompt !== 'string' || !prompt.trim()) {
        return `https://placehold.co/1080x1920/374151/9ca3af?text=No+Prompt`;
    }
    
    let nationality = cutOrShot.nationality || '';
    if (nationality === '한국') nationality = 'Korean';

    const references = prompt.match(/@([\w\uac00-\ud7a3]+)/g) || [];
     if (!nationality && references.length > 0) {
        const firstRefName = references[0].substring(1);
        const { state } = await import('./app.js');
        const referencedChar = state.story.characters.find(c => c.name === firstRefName);
        if (referencedChar) {
            nationality = referencedChar.nationality || '';
            if (nationality === '한국') nationality = 'Korean';
        }
    }

    const cleanedPrompt = prompt.replace(/@[\w\uac00-\ud7a3]+/g, (match, p1) => p1).trim();
    
    let finalPrompt = cleanedPrompt;
    if(nationality && !cleanedPrompt.toLowerCase().includes(nationality.toLowerCase())){
        finalPrompt = `${nationality} ${finalPrompt}`;
    }

    const textPrompt = `Photorealistic image of ${finalPrompt}. captured with a Sony A7 III, 35mm lens at f/1.8, cinematic lighting, dramatic, high detail. The final image MUST have an aspect ratio of 9:16.`;

    const parts = [{ text: textPrompt }];

    if (references.length > 0) {
        for (const refName of references) {
            const name = refName.substring(1);
            const refImage = characterReferenceImages[name] || locationReferenceImages[name];
            if (refImage && refImage.startsWith('data:image')) {
                parts.push({ inlineData: { mimeType: "image/png", data: refImage.split(',')[1] } });
            }
        }
    }
    
    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`;
        const payload = { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } };
        const result = await callAPI(apiUrl, payload, "Image Generation");
        const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        
        if (base64Data) {
            return `data:image/png;base64,${base64Data}`;
        }
        throw new Error('No image data from API');
    } catch(error) {
        console.error(`Image generation failed for prompt "${prompt}":`, error);
        return `https://placehold.co/1080x1920/374151/9ca3af?text=Error`;
    }
}

export async function improveScriptAPI(originalScript, keywords) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
    const systemPrompt = `You are South Korea's top Shorts drama scriptwriter. Take the user's original script and improve it into a more exciting, immersive 60-second Shorts drama script where the conflict is clear. The dialogue should be fast-paced, like a rally, and include elements that pique the viewer's curiosity. Refer to the keywords to make the theme clearer. The response should only be the improved script text.`;
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
