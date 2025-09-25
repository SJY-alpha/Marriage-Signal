// 앱의 상태(State) 관리, 초기화, 전체적인 흐름 제어를 담당합니다.

const app = {
    // DOM Elements
    elements: {},
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
        { name: 'Charon', gender: '남성', desc: '유익함' }, { name: 'Enceladus', gender: '남성', '숨소리' },
        { name: 'Fenrir', gender: '남성', desc: '흥분함' }, { name: 'Iapetus', gender: '남성', desc: '명확함' },
        { name: 'Orus', gender: '남성', desc: '단단함' }, { name: 'Puck', gender: '남성', desc: '경쾌함' },
        { name: 'Rasalgethi', gender: '남성', desc: '유익함' }, { name: 'Sadachbia', gender: '남성', desc: '활기참' },
        { name: 'Sadaltager', gender: '남성', desc: '박식함' }, { name: 'Schedar', gender: '남성', desc: '차분함' },
        { name: 'Umbriel', gender: '남성', desc: '느긋함' }, { name: 'Zubenelgenubi', gender: '남성', desc: '평범함' }
    ],
    personalitySystem: { "옵션풀": {}, "캐릭터": [] },
    playbackState: { isPlaying: false, intervalId: null, currentAbsTime: 0, currentCutIndex: -1, currentShotIndex: -1, audioContext: null, audioSources: [], playbackRange: null },
    singlePlayback: { audio: null, controlsElement: null, },
    ttsPreviewAudio: { audio: null, cache: {} },
    currentVersion: 2.7,
    activePersonalityCategory: 0,
    tempSelectedPersonality: [], 

    async init() {
        this.cacheDOMElements();
        await this.loadPersonalityData();
        this.populateNarratorVoices();
        this.bindInitialEventListeners();
        this.initTTSDebugConsole();
    },

    cacheDOMElements() {
        this.elements = {
            initialSettings: document.getElementById('initial-settings'),
            generateStoryBtn: document.getElementById('generate-story-btn'),
            improveScriptBtn: document.getElementById('improve-script-btn'),
            recommendKeywordsBtn: document.getElementById('recommend-keywords-btn'),
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
            // ... (add other elements as needed)
        };
    },
    
    // ... (rest of the main_app.js code from previous version)

    migrateProjectData(data) {
        const version = parseFloat(data.version) || 1.0;
        
        if (version < 2.7) {
            // Migrate old background structure to new grouped structure
            if (data.backgrounds && Array.isArray(data.backgrounds) && data.backgrounds.length > 0 && !data.backgrounds[0].groupName) {
                data.backgrounds = data.backgrounds.map(bg => ({
                    id: `bg_group_${Date.now()}_${Math.random()}`,
                    groupName: bg.name,
                    subImages: [{
                        subId: `sub_${Date.now()}_${Math.random()}`,
                        subName: '기본',
                        prompt: bg.prompt,
                        image: bg.image
                    }]
                }));
            }
        }
        
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
         data.version = this.currentVersion;
         return data;
     },
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

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
        };

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
            } else {
                throw new Error("JSON data does not contain '옵션풀' or '캐릭터' property.");
            }
        } catch (error) {
            console.error('Failed to load personality data:', error);
            this.ui.showToast('성격 시스템 데이터 로드에 실패했습니다. 기능이 제한될 수 있습니다.', 'error');
        }
    },
    
    // Other main logic, state management, utility functions...
    // ...
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
