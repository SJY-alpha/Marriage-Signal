// TTS 생성, 오디오 재생/정지, 데이터 변환 등 오디오 관련 모든 함수를 담당합니다.
// (generateAndCacheTTS, playTimeline, pcmToWav 등)

app.audio = {
    getTtsPromptForDialogue(dialogue) {
        let baseText = (dialogue.text || "").trim();
        let whisperMode = false;

        if (baseText.includes('(속으로)')) {
            baseText = baseText.replace(/\(속으로\)/g, '').trim();
            whisperMode = true;
        }

        const character = app.state.characters.find(c => c.id === dialogue.charId);
        
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
    },

    async generateAndCacheTTS(dialogue, text) {
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
             const character = app.state.characters.find(c => c.id === dialogue.charId);
             if (!character) {
                app.logToTTSConsole('TTS 생성 실패: 캐릭터 없음', { '캐릭터 ID': dialogue.charId, '대사': newText }, true);
                throw new Error(`Character with id ${dialogue.charId} not found.`);
             }

             app.logToTTSConsole('TTS 생성 시작', { '대사': newText, '캐릭터': character.name });
             
             const ttsPrompt = this.getTtsPromptForDialogue(dialogue);
             const voice = character.voice || 'Kore';
             
             app.logToTTSConsole('API 요청 데이터', {'프롬프트': ttsPrompt, '보이스': voice });

             const base64Audio = await app.api.generateTTSAPI(ttsPrompt, voice);

             app.logToTTSConsole('✅ TTS 생성 성공', {});
             
             const pcmBuffer = app.base64ToArrayBuffer(base64Audio);
             dialogue.pcmData = new Int16Array(pcmBuffer);
             dialogue.audioDuration = (dialogue.pcmData.length / 24000);
             const wavBlob = app.pcmToWav(pcmBuffer, 24000);
             dialogue.cachedBlobUrl = URL.createObjectURL(wavBlob);
             success = true;

         } catch (error) {
             app.logToTTSConsole('TTS 생성 최종 실패', { '대사': newText, '오류': error.message }, true);
             success = false;
         }
        
         if (!success) dialogue.audioDuration = null;
         return success;
    },

    // All other audio related functions (playback, data conversion, etc.) go here...
    // ...
};
