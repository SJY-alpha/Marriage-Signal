import { generateFullStory, improveScript, saveProject, loadProject } from './app.js';
import { 
    switchTab, closeImageModal, flipImageModal, downloadImageModal, 
    closePromptModal, savePrompt, closePersonalityModal, savePersonality, 
    closeConfirmModal, applyTtsSettingsToTimeline, initTTSDebugConsole,
    populateNarratorVoices
} from './ui.js';
import { playTimeline, pauseTimeline, stopTimeline } from './playback.js';
import { downloadAllTTS, previewTTSVoice } from './audio.js';
import { state } from './app.js';

export function bindInitialEventListeners() {
    document.getElementById('generate-story-btn').addEventListener('click', generateFullStory);
    document.getElementById('improve-script-btn').addEventListener('click', improveScript);
    
    document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', (e) => switchTab(e.currentTarget)));
    document.getElementById('modal-close').addEventListener('click', closeImageModal);
    document.getElementById('image-modal').addEventListener('click', (e) => { if(e.target.id === 'image-modal') closeImageModal() });
    document.getElementById('modal-flip').addEventListener('click', flipImageModal);
    document.getElementById('modal-download').addEventListener('click', downloadImageModal);

    document.getElementById('prompt-modal-cancel').addEventListener('click', closePromptModal);
    document.getElementById('prompt-modal-save').addEventListener('click', savePrompt);
    
    document.getElementById('personality-modal-cancel').addEventListener('click', closePersonalityModal);
    document.getElementById('personality-modal-save').addEventListener('click', savePersonality);

    document.getElementById('timeline-play').addEventListener('click', playTimeline);
    document.getElementById('timeline-pause').addEventListener('click', pauseTimeline);
    document.getElementById('timeline-stop').addEventListener('click', stopTimeline);
    document.getElementById('save-project-btn').addEventListener('click', saveProject);
    document.getElementById('load-project-btn').addEventListener('click', () => document.getElementById('file-loader').click());
    document.getElementById('file-loader').addEventListener('change', (e) => loadProject(e));
    document.getElementById('player-close').addEventListener('click', stopTimeline);
    document.getElementById('download-all-audio-btn').addEventListener('click', downloadAllTTS);
    
    // Narrator controls
    const narratorVoiceSelect = document.getElementById('narrator-voice');
    const narratorPitchSlider = document.getElementById('narrator-pitch-slider');
    const narratorSpeedSlider = document.getElementById('narrator-speed-slider');
    
    const updateNarratorSetting = (key, value) => {
        let narrator = state.story.characters?.find(c => c.id === 'narrator');
        if (!narrator && state.story.characters) {
            narrator = { id: 'narrator', name: '나레이션' };
            state.story.characters.push(narrator);
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
        const narrator = state.story.characters?.find(c => c.id === 'narrator');
        if (narrator) {
           previewTTSVoice({ voice: narrator.voice || 'Charon', speed: narrator.speed || 1.0, pitch: narrator.pitch || 0.0 }, e.currentTarget);
        }
    });
     document.getElementById('narrator-apply-all').addEventListener('click', () => applyTtsSettingsToTimeline('narrator'));
                                
    document.getElementById('confirm-modal-cancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-modal').addEventListener('click', (e) => { if (e.target.id === 'confirm-modal') closeConfirmModal() });

    initTTSDebugConsole();
    populateNarratorVoices();
}
