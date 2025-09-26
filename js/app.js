// [ app.js ]
// 결혼시그널 제작소 메인 애플리케이션 로직

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // DOM Elements
        initialSettings: document.getElementById('initial-settings'),
        generateStoryBtn: document.getElementById('generate-story-btn'),
        improveScriptBtn: document.getElementById('improve-script-btn'),
        loadingIndicator: document.getElementById('loading-indicator'),
        loadingMessage: document.getElementById('loading-message'),
        editorSection: document.getElementById('editor-section'),
        characterReferences: document.getElementById('character-references'),
        backgroundTabs: document.getElementById('background-tabs'),
        backgroundReferences: document.getElementById('background-references'),
        timelineContainer: document.getElementById('timeline-container'),
        totalTimeDisplay: document.getElementById('total-time'),
        currentTimeDisplay: document.getElementById('current-time'),
        videoPlayerModal: document.getElementById('video-player-modal'),
        mentionDropdown: document.getElementById('mention-dropdown'),
        scenarioTitle: document.getElementById('scenario-title'),
        ttsDebugConsole: document.getElementById('tts-debug-console'),
        ttsDebugOutput: document.getElementById('tts-debug-output'),
        showTTSConsoleBtn: document.getElementById('show-tts-console-btn'),
        clearTTSConsoleBtn: document.getElementById('clear-tts-console-btn'),
        closeTTSConsoleBtn: document.getElementById('close-tts-console-btn'),

        // State
        state: {},
        activeBgTab: 1,
        ttsVoices: [
            { name: 'Achernar', gender: '여성', desc: '부드러움' }, { name: 'Aoede', gender: '여성', desc: '산뜻함' },
            { name: 'Autonoe', gender: '여성', desc: '밝음' }, { name: 'Callirrhoe', gender: '여성', desc: '느긋함' },
            { name: 'Despina', gender: '여성', desc: '부드러움' }, { name: 'Erinome', gender: '여성', desc: '명확함' },
            { name: 'Gacrux', gender: '여성', desc: '성숙함' }, { name: 'Kore', gender: '여성', desc: '단호함' },
            { name: 'Laomedeia', gender: '여성', desc: '경쾌함' }, { name: 'Leda', gender: '여성', desc: '젊음' },
            { name: 'Pulcherrima', gender: '여성', desc: '당참' }, { name: 'Sulafat', gender: '여성', desc: '따뜻함' },
            { name: 'Vindemiatrix', gender: '여성', desc: '온화함' }, { name: 'Zephyr', gender: '여성', desc: '밝음' },
            { name: 'Achird', gender: '남성', desc: '친근함' }, { name: 'Algenib', gender: '남성', desc: '거침' },
            { name: 'Algieba', gender: '남성', desc: '부드러움' }, { name: 'Alnilam', gender: '남성', desc: '단단함' },
            { name: 'Charon', gender: '남성', desc: '유익함' }, { name: 'Enceladus', gender: '남성', desc: '숨소리' },
            { name: 'Fenrir', gender: '남성', desc: '흥분함' }, { name: 'Iapetus', gender: '남성', desc: '명확함' },
            { name: 'Orus', gender: '남성', desc: '단단함' }, { name: 'Puck', gender: '남성', desc: '경쾌함' },
            { name: 'Rasalgethi', gender: '남성', desc: '유익함' }, { name: 'Sadachbia', gender: '남성', desc: '활기참' },
            { name: 'Sadaltager', gender: '남성', desc: '박식함' }, { name: 'Schedar', gender: '남성', desc: '차분함' },
            { name: 'Umbriel', gender: '남성', desc: '느긋함' }, { name: 'Zubenelgenubi', gender: '남성', desc: '평범함' }
        ],
        personalitySystem: { "옵션풀": {}, "캐릭터": [] },
        playbackState: { isPlaying: false, intervalId: null, currentAbsTime: 0, currentCutIndex: -1, currentShotIndex: -1, audioContext: null, audioSources: [] },
        singlePlayback: { audio: null, controlsElement: null, },
        ttsPreviewAudio: { audio: null, cache: {} },
        currentVersion: 2.4,
        activePersonalityCategory: 0,
        tempSelectedPersonality: [],


        async init() {
            await this.loadPersonalityData();
            this.populateNarratorVoices();
            this.bindInitialEventListeners();
            this.initTTSDebugConsole();
        },

        async loadPersonalityData() {
            try {
                const response = await fetch('https://raw.githubusercontent.com/SJY-alpha/Marriage-Signal/main/document/CharacterKeywordSystem.json');
                if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
                const data = await response.json();
                if (data && data.옵션풀 && data.캐릭터) {
                    this.personalitySystem = data;
                    this.logToTTSConsole('성격 키워드 시스템 로드 성공', `${this.personalitySystem.캐릭터.length}개의 키워드 그룹 로드됨`);
                } else {
                    throw new Error("JSON data does not contain '옵션풀' or '캐릭터' property.");
                }
            } catch (error) {
                console.error('Failed to load personality data:', error);
                this.logToTTSConsole('성격 키워드 시스템 로드 실패', { error: error.message }, true);
                this.showToast('성격 시스템 데이터 로드에 실패했습니다. 기능이 제한될 수 있습니다.', 'error');
            }
        },

        initTTSDebugConsole() {
            this.showTTSConsoleBtn.addEventListener('click', () => {
                this.ttsDebugConsole.classList.remove('hidden');
                this.showTTSConsoleBtn.classList.add('hidden');
            });
            this.closeTTSConsoleBtn.addEventListener('click', () => {
                this.ttsDebugConsole.classList.add('hidden');
                this.showTTSConsoleBtn.classList.remove('hidden');
            });
            this.clearTTSConsoleBtn.addEventListener('click', () => {
                this.ttsDebugOutput.innerHTML = '';
            });
        },

        logToTTSConsole(title, data, isError = false) {
            if (isError) console.error(title, data);
            else console.log(title, data);

            const logEntry = document.createElement('div');
            logEntry.className = 'p-1 border-b border-gray-700';

            let prettyData = '';
            try {
                prettyData = JSON.stringify(data, null, 2);
            } catch (e) {
                prettyData = 'Could not stringify object.';
            }

            const titleColor = isError ? 'text-red-500' : 'text-yellow-400';
            logEntry.innerHTML = `<div class="flex justify-between"><span class="font-bold ${titleColor}">${title}</span><span class="text-green-400">${new Date().toLocaleTimeString()}</span></div><pre class="whitespace-pre-wrap text-gray-300">${prettyData}</pre>`;

            this.ttsDebugOutput.appendChild(logEntry);
            this.ttsDebugOutput.scrollTop = this.ttsDebugOutput.scrollHeight;
        },

        formatVoiceForDisplay(voiceName) {
            const voice = this.ttsVoices.find(v => v.name === voiceName);
            return voice ? `${voice.name} (${voice.gender}, ${voice.desc})` : voiceName;
        },

        populateNarratorVoices() {
            const select = document.getElementById('narrator-voice');
            select.innerHTML = '';
            ['여성', '남성'].forEach(gender => {
                const group = document.createElement('optgroup');
                group.label = gender;
                this.ttsVoices.filter(v => v.gender === gender).forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = this.formatVoiceForDisplay(voice.name);
                    group.appendChild(option);
                });
                select.appendChild(group);
            });
            select.value = 'Charon'; // Default narrator voice
        },

        bindInitialEventListeners() {
            this.generateStoryBtn.addEventListener('click', () => this.generateFullStory());
            this.improveScriptBtn.addEventListener('click', () => this.improveScript());

            document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', (e) => this.switchTab(e.currentTarget)));
            document.getElementById('modal-close').addEventListener('click', () => this.closeImageModal());
            document.getElementById('image-modal').addEventListener('click', (e) => { if (e.target.id === 'image-modal') this.closeImageModal() });
            document.getElementById('modal-flip').addEventListener('click', () => this.flipImageModal());
            document.getElementById('modal-download').addEventListener('click', () => this.downloadImageModal());
            document.getElementById('prompt-modal-cancel').addEventListener('click', () => this.closePromptModal());
            document.getElementById('prompt-modal-save').addEventListener('click', () => this.savePrompt());

            document.getElementById('personality-modal-cancel').addEventListener('click', () => this.closePersonalityModal());
            document.getElementById('personality-modal-save').addEventListener('click', () => this.savePersonality());

            document.getElementById('timeline-play').addEventListener('click', () => this.playTimeline());
            document.getElementById('timeline-pause').addEventListener('click', () => this.pauseTimeline());
            document.getElementById('timeline-stop').addEventListener('click', () => this.stopTimeline());
            document.getElementById('save-project-btn').addEventListener('click', () => this.saveProject());
            document.getElementById('load-project-btn').addEventListener('click', () => document.getElementById('file-loader').click());
            document.getElementById('file-loader').addEventListener('change', (e) => this.loadProject(e));
            document.getElementById('player-close').addEventListener('click', () => this.stopTimeline());
            document.getElementById('download-all-audio-btn').addEventListener('click', () => this.downloadAllTTS());

            const narratorVoiceSelect = document.getElementById('narrator-voice');
            const narratorPitchSlider = document.getElementById('narrator-pitch-slider');
            const narratorSpeedSlider = document.getElementById('narrator-speed-slider');

            const updateNarratorSetting = (key, value) => {
                let narrator = this.state.characters?.find(c => c.id === 'narrator');
                if (!narrator && this.state.characters) {
                    narrator = { id: 'narrator', name: '나레이션' };
                    this.state.characters.push(narrator);
                }
                if (narrator) {
                    narrator[key] = value;
                }
            };
            narratorVoiceSelect.addEventListener('change', (e) => updateNarratorSetting('voice', e.target.value));
            narratorPitchSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                updateNarratorSetting('pitch', value);
                document.getElementById('narrator-pitch-value').textContent = value.toFixed(2);
            });
            narratorSpeedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                updateNarratorSetting('speed', value);
                document.getElementById('narrator-speed-value').textContent = value.toFixed(2);
            });
            document.getElementById('narrator-voice-preview').addEventListener('click', (e) => {
                const narrator = this.state.characters?.find(c => c.id === 'narrator');
                if (narrator) {
                    this.previewTTSVoice({ voice: narrator.voice || 'Charon', speed: narrator.speed || 1.0, pitch: narrator.pitch || 0.0 }, e.currentTarget);
                }
            });
            document.getElementById('narrator-apply-all').addEventListener('click', () => this.applyTtsSettingsToTimeline('narrator'));

            document.getElementById('confirm-modal-cancel').addEventListener('click', () => this.closeConfirmModal());
            document.getElementById('confirm-modal').addEventListener('click', (e) => { if (e.target.id === 'confirm-modal') this.closeConfirmModal() });
        },

        async generateFullStory() {
            this.initialSettings.classList.add('hidden');
            this.loadingIndicator.style.display = 'flex';
            let currentStep = 1;
            const totalSteps = 4;
            const updateLoadingMessage = (message) => {
                this.loadingMessage.textContent = `${message}... ⏳ (${currentStep}/${totalSteps})`;
                currentStep++;
            };

            try {
                updateLoadingMessage('AI가 시나리오와 캐릭터를 창작하고 있습니다');
                const keywords = document.getElementById('keywords').value;
                const duration = document.getElementById('duration').value;
                const script = document.getElementById('script-input').value;
                let storyData = await apiUtils.generateStoryAPI(keywords, duration, script);
                if (!storyData || !storyData.characters || !storyData.cutscenes) {
                    throw new Error("API로부터 유효한 시나리오 데이터를 받지 못했습니다. 데이터 구조를 확인해주세요.");
                }

                storyData.cutscenes.forEach(cut => {
                    cut.autoAdjustDuration = cut.autoAdjustDuration ?? true;
                    if (cut.imagePrompt && !cut.shots) {
                        cut.shots = [{ shotId: 1, imagePrompt: cut.imagePrompt, videoPrompt: cut.videoPrompt, startTime: 0, image: null }];
                        delete cut.imagePrompt; delete cut.videoPrompt; delete cut.image;
                    }
                    cut.shots = cut.shots || [];
                    cut.shots.forEach(shot => {
                        shot.startTime = shot.startTime ?? 0;
                    });
                    cut.dialogues.forEach(d => {
                        d.audioSrc = null; d.cachedBlobUrl = null; d.pcmData = null; d.audioDuration = null;
                        d.startTime = d.startTime ?? 0;
                        d.postDelay = d.postDelay ?? (Math.random() * 0.9 + 0.1);
                        d.ttsPrompt = d.ttsPrompt || '';
                    });
                });
                this.state = storyData;
                if (this.state.characters) {
                    const narrator = this.state.characters.find(c => c.id === 'narrator');
                    if (narrator) {
                        narrator.pitch = narrator.pitch ?? 0.0;
                        narrator.speed = narrator.speed ?? 1.0;
                        narrator.voice = narrator.voice ?? 'Charon';
                    }
                    this.state.characters.forEach(char => {
                        if (!char.nationality) char.nationality = "한국";
                        if (char.id !== 'narrator') {
                            this.applyPersonality(char);
                        }
                    });
                }

                updateLoadingMessage('레퍼런스 이미지를 생성하고 있습니다');
                await this.generateAllReferenceImages();

                updateLoadingMessage('컷신 이미지를 생성하고 있습니다');
                await this.generateAllShotImages();

                updateLoadingMessage('대사 음성을 생성하고 있습니다');
                await this.generateAllTTS();

                await this.intelligentlySetAllTimings();

                this.loadingIndicator.style.display = 'none';
                this.renderAll();
                this.editorSection.classList.remove('hidden');

            } catch (error) {
                console.error("전체 스토리 생성 실패:", error);
                this.loadingIndicator.style.display = 'none';
                this.initialSettings.classList.remove('hidden');
                this.showToast(`시나리오 생성에 실패했습니다: ${error.message}`, 'error');
            }
        },

        applyPersonality(character) {
            const keywords = (character.personality || "").split(',').map(t => t.trim()).filter(Boolean);
            if (keywords.length === 0) return;

            const characterGender = character.gender;
            const genderKey = characterGender === '남성' ? '남성' : '여성';
            const selectedMappings = this.personalitySystem.캐릭터
                .filter(mapping => keywords.includes(mapping['성격 키워드']) && mapping[genderKey])
                .map(mapping => mapping[genderKey]);
            if (selectedMappings.length === 0) {
                console.warn(`No matching personality mappings for character ${character.name} with gender ${characterGender} and keywords: ${keywords.join(', ')}`);
                return;
            }

            const chosenMapping = selectedMappings[Math.floor(Math.random() * selectedMappings.length)];
            character.voice = chosenMapping.보이스;
            character.tts_tone = chosenMapping.톤;
            character.pitch = chosenMapping.Pitch;
            character.speed = chosenMapping['Speaking Rate'];

            const { 옵션풀 } = this.personalitySystem;
            const genderedOptionPool = 옵션풀[genderKey] || 옵션풀;
            const randomChoice = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : '';

            const appearanceParts = [
                chosenMapping['기본 외모'],
                randomChoice(genderedOptionPool['눈']),
                randomChoice(genderedOptionPool['입']),
                randomChoice(genderedOptionPool['코']),
                randomChoice(genderedOptionPool['눈썹']),
                randomChoice(genderedOptionPool['몸매'])
            ].filter(Boolean);
            const fashion = randomChoice(chosenMapping['패션']);
            const hair = randomChoice(chosenMapping['헤어']);

            const basePrompt = `A ${character.nationality} ${character.gender === '남성' ? 'man' : 'woman'} in his 30s, ${appearanceParts.join(', ')}. Wearing ${fashion}. Hair is ${hair}. photorealistic, cinematic lighting.`;
            character.prompt = basePrompt;
        },

        async generateAllReferenceImages() {
            if (!this.state.characters || !this.state.backgrounds) return;
            const imagePromises = [];
            for (const item of this.state.characters) {
                if (item.id === 'narrator') continue;
                imagePromises.push(
                    this.generateImageForCut(item, {}, {}).then(img => { item.image = img; })
                );
            }
            for (const item of this.state.backgrounds) {
                imagePromises.push(
                    this.generateImageForCut(item, {}, {}).then(img => { item.image = img; })
                );
            }
            await Promise.all(imagePromises);
        },

        async generateAllShotImages() {
            if (!this.state.cutscenes) return;
            const characterReferenceImages = Object.fromEntries(this.state.characters.filter(c => c.image).map(c => [c.name, c.image]));
            const locationReferenceImages = Object.fromEntries(this.state.backgrounds.filter(b => b.image).map(b => [b.name, b.image]));
            const allShots = this.state.cutscenes.flatMap(cutscene => cutscene.shots);

            for (const shot of allShots) {
                shot.image = await this.generateImageForCut(shot, characterReferenceImages, locationReferenceImages);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        },

        async generateAllTTS() {
            if (!this.state.cutscenes) return;
            const allDialogues = this.state.cutscenes.flatMap(cut => cut.dialogues);
            for (const dialogue of allDialogues) {
                await this.generateAndCacheTTS(dialogue, dialogue.text);
                await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
            }
        },

        getTtsPromptForDialogue(dialogue) {
            let baseText = (dialogue.text || "").trim();
            let whisperMode = false;

            if (baseText.includes('(속으로)')) {
                baseText = baseText.replace(/\(속으로\)/g, '').trim();
                whisperMode = true;
            }

            const character = this.state.characters.find(c => c.id === dialogue.charId);
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
                const character = this.state.characters.find(c => c.id === dialogue.charId);
                if (!character) {
                    this.logToTTSConsole('TTS 생성 실패: 캐릭터 없음', { '캐릭터 ID': dialogue.charId, '대사': newText }, true);
                    throw new Error(`Character with id ${dialogue.charId} not found.`);
                }

                this.logToTTSConsole('TTS 생성 시작', { '대사': newText, '캐릭터': character.name });
                const ttsPrompt = this.getTtsPromptForDialogue(dialogue);
                const voice = character.voice || 'Kore';

                this.logToTTSConsole('API 요청 데이터', { '프롬프트': ttsPrompt, '보이스': voice });
                const base64Audio = await apiUtils.generateTTSAPI(ttsPrompt, voice);

                this.logToTTSConsole('✅ TTS 생성 성공', {});

                const pcmBuffer = apiUtils.base64ToArrayBuffer(base64Audio);
                dialogue.pcmData = new Int16Array(pcmBuffer);
                dialogue.audioDuration = (dialogue.pcmData.length / 24000);
                const wavBlob = apiUtils.pcmToWav(pcmBuffer, 24000);
                dialogue.cachedBlobUrl = URL.createObjectURL(wavBlob);
                success = true;
            } catch (error) {
                this.logToTTSConsole('TTS 생성 최종 실패', { '대사': newText, '오류': error.message }, true);
                success = false;
            }

            if (!success) dialogue.audioDuration = null;
            return success;
        },

        async improveScript() {
            const improveBtn = this.improveScriptBtn;
            const scriptTextarea = document.getElementById('script-input');

            improveBtn.disabled = true;
            improveBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> 개선 중...`;
            try {
                const originalScript = scriptTextarea.value;
                if (!originalScript.trim()) {
                    this.showToast('개선할 대본을 먼저 입력해주세요.', 'info');
                } else {
                    const keywords = document.getElementById('keywords').value;
                    const improvedScript = await apiUtils.improveScriptAPI(keywords, originalScript);
                    scriptTextarea.value = improvedScript;
                    this.showToast('AI가 대본을 개선했습니다!', 'success');
                }
            } catch (error) {
                console.error("대본 개선 실패:", error);
                this.showToast('대본 개선에 실패했습니다.', 'error');
            } finally {
                improveBtn.disabled = false;
                improveBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles mr-1"></i> AI 대본 개선`;
            }
        },
        
        async generateImageForCut(cutOrShot, characterReferenceImages, locationReferenceImages) {
            let prompt = cutOrShot.imagePrompt || cutOrShot.prompt;
            if (typeof prompt !== 'string' || !prompt.trim()) {
                return `https://placehold.co/1080x1920/374151/9ca3af?text=No+Prompt`;
            }
            let nationality = cutOrShot.nationality || '';
            if (nationality === '한국') nationality = 'Korean';
            const references = prompt.match(/@([\w\uac00-\ud7a3]+)/g) || [];
            if (!nationality && references.length > 0) {
                const firstRefName = references[0].substring(1);
                const referencedChar = this.state.characters.find(c => c.name === firstRefName);
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
                const result = await apiUtils.callAPI(apiUrl, payload, "Image Generation");
                const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                if (base64Data) {
                    const rawUrl = `data:image/png;base64,${base64Data}`;
                    return await apiUtils.forceAspect(rawUrl, '9:16');
                }
                throw new Error('No image data from API');
            } catch(error) {
                console.error(`Image generation failed for prompt "${prompt}":`, error);
                return `https://placehold.co/1080x1920/374151/9ca3af?text=Error`;
            }
        },

        stopSinglePlayback() {
            if (this.singlePlayback.audio) {
                this.singlePlayback.audio.pause();
                this.singlePlayback.audio = null;
            }
            if (this.singlePlayback.controlsElement) {
                const btn = this.singlePlayback.controlsElement.querySelector('.dialogue-play-pause-btn i');
                btn.className = 'fas fa-play';
                const audioReady = this.singlePlayback.dialogue?.cachedBlobUrl;
                if (audioReady) btn.classList.add('fa-volume-up', 'text-green-400');
                this.singlePlayback.controlsElement.querySelector('.dialogue-stop-btn').classList.add('hidden');
                this.singlePlayback.controlsElement = null;
                this.singlePlayback.dialogue = null;
            }
        },
        async playSingleDialogue(dialogue, controlsElement) {
            const playPauseBtn = controlsElement.querySelector('.dialogue-play-pause-btn');
            if (this.singlePlayback.audio && this.singlePlayback.dialogue === dialogue) {
                if (this.singlePlayback.audio.paused) {
                    this.singlePlayback.audio.play();
                } else {
                    this.singlePlayback.audio.pause();
                }
                return;
            }
            this.stopSinglePlayback();
            this.singlePlayback.controlsElement = controlsElement;
            this.singlePlayback.dialogue = dialogue;
            const stopBtn = controlsElement.querySelector('.dialogue-stop-btn');
            try {
                const audioUrl = dialogue.cachedBlobUrl;
                if (!audioUrl) throw new Error("음성 데이터가 없습니다. 먼저 생성해주세요.");
                this.singlePlayback.audio = new Audio(audioUrl);
                const icon = playPauseBtn.querySelector('i');
                this.singlePlayback.audio.onplay = () => {
                    icon.className = 'fas fa-pause';
                    stopBtn.classList.remove('hidden');
                };
                this.singlePlayback.audio.onpause = () => {
                    if (this.singlePlayback.audio && this.singlePlayback.audio.currentTime < this.singlePlayback.audio.duration) {
                        icon.className = 'fas fa-play';
                    }
                };
                this.singlePlayback.audio.onended = () => {
                    this.stopSinglePlayback();
                };
                this.singlePlayback.audio.play();
            } catch (error) {
                console.error("오디오 재생 실패:", error);
                this.showToast(error.message, 'error');
                this.stopSinglePlayback();
            }
        },
        async downloadSingleTTS(dialogue) {
            if (!dialogue.pcmData) {
                this.showToast("음성 데이터가 없습니다.", 'error');
                return;
            }
            const mp3Blob = await apiUtils.convertPcmToMp3Blob(dialogue.pcmData);
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = apiUtils.sanitizeFilename(dialogue.text);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        async downloadAllTTS() {
            const btn = document.getElementById('download-all-audio-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...`;
            const zip = new JSZip();
            const filenames = new Set();
            for (const cut of this.state.cutscenes) {
                for (const dialogue of cut.dialogues) {
                    if (dialogue.pcmData) {
                        const mp3Blob = await apiUtils.convertPcmToMp3Blob(dialogue.pcmData);
                        let baseFilename = apiUtils.sanitizeFilename(dialogue.text).replace('.mp3', '');
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
        },

        // ... 여기서부터 나머지 모든 함수는 원래 코드와 동일하게 유지됩니다.
        // renderAll, switchTab, renderCharacters, renderNarratorControls, renderBackgrounds, createReferenceCard,
        // createLoadingOverlay, updateCharacterDetails, applyReferenceToAll, applyTtsSettingsToTimeline,
        // regenerateCutscenesForReference, previewTTSVoice, renderTimeline, copyTextToClipboard,
        // createPromptBox, createVideoPromptBox, formatPromptForEditing, parsePromptFromEditing,
        // handlePromptClick, showMentionDropdown, handlePromptAction, moveCut, deleteCut, updateTotalTime,
        // intelligentlySetAllTimings, intelligentlySetTimings, recalculateAllCutDurations,
        // recalculateCutDuration, playTimeline, pauseTimeline, stopTimeline, scheduleAudio,
        // updatePlaybackFrame, showImageModal, closeImageModal, flipImageModal, downloadImageModal,
        // showPromptModal, closePromptModal, savePrompt, showPersonalityModal, renderPersonalityCategories,
        // renderPersonalityTags, updatePersonalityTagStates, savePersonality, closePersonalityModal,
        // saveProject, loadProject, migrateProjectData, showToast, showConfirmModal, closeConfirmModal
        // 이 모든 함수들을 여기에 복사-붙여넣기 하세요.
        // (단, saveProject와 loadProject 내에서 blob/wav 변환 함수 호출 부분은 apiUtils를 사용하도록 이미 수정되었습니다.)
        // (전체 코드가 너무 길어 생략하였으니, 원래 코드에서 이 부분들을 복사해오시면 됩니다.)

        // 예시: renderAll 함수 (이런 식으로 모든 함수를 붙여넣으세요)
        renderAll() { this.scenarioTitle.textContent = this.state.title; this.renderCharacters(); this.renderBackgrounds(); this.renderTimeline(); this.updateTotalTime(); },
        switchTab(button) { document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); button.classList.add('active'); document.querySelectorAll('.tab-content').forEach(content => { content.id === button.dataset.tab ? content.classList.remove('hidden') : content.classList.add('hidden'); }); },

        // (이하 모든 함수를 동일하게 추가...)
        
        async saveProject() {
            const btn = document.getElementById('save-project-btn');
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...`;
            try {
                const saveData = JSON.parse(JSON.stringify(this.state));
                saveData.version = this.currentVersion;
                for (const cut of saveData.cutscenes) {
                    for (const dialogue of cut.dialogues) {
                        if (dialogue.cachedBlobUrl) {
                            dialogue.audioData_base64 = await apiUtils.blobToBase64(await fetch(dialogue.cachedBlobUrl).then(r => r.blob()));
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
                a.download = `결혼시그널_${keywords || 'project'}_v${this.currentVersion}.json`;
                a.href = url;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('프로젝트가 성공적으로 저장되었습니다.', 'success');
            } catch (error) {
                console.error("Project save failed:", error);
                this.showToast('프로젝트 저장에 실패했습니다.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-save mr-2"></i>저장`;
            }
        },
        async loadProject(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    let loadedState = JSON.parse(e.target.result);
                    loadedState = this.migrateProjectData(loadedState);
                    for (const cut of loadedState.cutscenes) {
                        for (const dialogue of cut.dialogues) {
                            if (dialogue.audioData_base64) {
                                const blob = await (await fetch(dialogue.audioData_base64)).blob();
                                dialogue.cachedBlobUrl = URL.createObjectURL(blob);
                                const pcmBuffer = await apiUtils.wavBlobToArrayBuffer(blob);
                                dialogue.pcmData = new Int16Array(pcmBuffer);
                                delete dialogue.audioData_base64;
                            }
                        }
                    }
                    this.state = loadedState;
                    this.renderAll();
                    this.editorSection.classList.remove("hidden");
                    this.initialSettings.classList.add("hidden");
                    this.showToast("프로젝트를 성공적으로 불러왔습니다.", 'success');
                } catch (error) {
                    console.error("Project load failed:", error);
                    this.showToast(`프로젝트 불러오기에 실패했습니다: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        },
        // (위의 주석 처리된 함수 목록을 여기에 모두 추가해주세요)

    };
    app.init();
});
