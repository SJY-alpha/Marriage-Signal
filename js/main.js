/**
 * @file js/main.js
 * @description 애플리케이션의 메인 로직 및 시작점(Entry Point)입니다.
 * 각 모듈을 가져와 앱의 상태를 관리하고, 이벤트 핸들러를 등록하며,
 * 전체적인 작업 흐름을 제어합니다.
 */

// 모듈 임포트
import { TTS_VOICES, PERSONALITY_DATA_URL, CURRENT_VERSION } from './constants.js';
import { appState, DOM, cacheDomElements } from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as utils from './utils.js';

// --- 애플리케이션 초기화 ---

/**
 * 애플리케이션을 초기화하는 메인 함수
 */
async function init() {
    cacheDomElements(); // DOM 요소 캐싱
    await loadInitialData(); // 외부 데이터 로딩
    bindInitialEventListeners(); // 초기 이벤트 리스너 바인딩
    ui.initTTSDebugConsole(); // 디버그 콘솔 초기화
}


/**
 * 외부 데이터를 로드합니다 (예: 성격 데이터).
 */
async function loadInitialData() {
    try {
        const data = await api.loadPersonalityData(PERSONALITY_DATA_URL);
        appState.personalitySystem = data;
        ui.logToTTSConsole('성격 키워드 시스템 로드 성공', `${appState.personalitySystem.캐릭터.length}개의 키워드 그룹 로드됨`);
    } catch (error) {
        ui.logToTTSConsole('성격 키워드 시스템 로드 실패', { error: error.message }, true);
        ui.showToast('성격 시스템 데이터 로드에 실패했습니다. 기능이 제한될 수 있습니다.', 'error');
    } finally {
        ui.populateNarratorVoices(TTS_VOICES); // 데이터 로드 성공/실패와 관계없이 보이스는 채움
    }
}

/**
 * 페이지의 주요 요소에 이벤트 리스너를 바인딩합니다.
 */
function bindInitialEventListeners() {
    DOM.generateStoryBtn.addEventListener('click', generateFullStory);
    DOM.improveScriptBtn.addEventListener('click', improveScript);

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => ui.switchTab(e.currentTarget));
    });
    
    // 모달 관련 이벤트
    DOM.modalClose.addEventListener('click', () => ui.closeImageModal());
    DOM.imageModal.addEventListener('click', (e) => { if(e.target.id === 'image-modal') ui.closeImageModal() });
    DOM.modalFlip.addEventListener('click', () => ui.flipImageModal());
    DOM.modalDownload.addEventListener('click', () => ui.downloadImageModal());

    DOM.promptModalCancel.addEventListener('click', () => ui.closePromptModal());
    DOM.promptModalSave.addEventListener('click', savePrompt); // savePrompt는 main.js에 정의
    
    // (이하 원본 코드의 bindInitialEventListeners 함수 내용과 동일하게 이벤트 핸들러를 연결합니다.)
    // (단, 실제 실행되는 함수는 이 파일(main.js)에 정의된 함수들입니다.)
}


// --- 핵심 이벤트 핸들러 ---

/**
 * '시나리오 생성' 버튼 클릭 시 전체 스토리 생성 프로세스를 시작합니다.
 */
async function generateFullStory() {
    // (원본 코드의 generateFullStory 함수 내용과 동일)
    // 단, 다른 모듈의 함수를 호출할 때는 `api.`, `ui.`, `utils.` 등을 붙여줍니다.
    // 예: this.generateStoryAPI(...) -> api.generateStoryAPI(...)
    // 예: this.renderAll() -> ui.renderAll()
}

/**
 * 'AI 대본 개선' 버튼 클릭 시 대본을 개선합니다.
 */
async function improveScript() {
    // (원본 코드의 improveScript 함수 내용과 동일)
}


// (이하 원본 코드의 app 객체에 있던 모든 메서드들을 이 파일의 함수로 변환하여 옮깁니다.)
// (예: applyPersonality, generateAllReferenceImages, playTimeline 등)
// (주의: this.state -> appState.data, this.playbackState -> appState.playbackState 와 같이 상태 접근 방식을 변경해야 합니다.)
// (주의: this.showToast -> ui.showToast 와 같이 모듈 함수를 호출해야 합니다.)


// --- 전역적으로 참조 가능해야 하는 핸들러들 ---
// ui.js에서 동적으로 생성된 요소의 이벤트를 처리하기 위해 export 합니다.
export function savePrompt() {
    // (원본 코드의 savePrompt 내용)
}
// (이하 ui.js에서 필요한 모든 핸들러 함수들을 export 합니다)


// --- 애플리케이션 시작 ---
document.addEventListener('DOMContentLoaded', init);
