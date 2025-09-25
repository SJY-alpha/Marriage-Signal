// 화면 렌더링, 모달창 제어 등 UI와 관련된 모든 함수를 담당합니다.
app.ui = {
    renderAll() { 
        app.elements.scenarioTitle.textContent = app.state.title; 
        this.renderCharacters(); 
        this.renderBackgrounds(); 
        this.renderTimeline(); 
        app.updateTotalTime(); 
    },
    
    // ... (most of the ui_manager.js code remains the same)

    renderBackgrounds() {
        const bgContainer = app.elements.backgroundReferences;
        const bgTabs = app.elements.backgroundTabs;
        bgTabs.innerHTML = ''; // Clear old tabs
        bgContainer.innerHTML = `
            <div class="col-span-full text-center p-8 bg-gray-700 rounded-lg">
                <h4 class="text-lg font-bold text-gray-300">새로운 배경 관리 시스템</h4>
                <p class="text-gray-400 mt-2">다음 업데이트에서 그룹화된 배경 관리 기능이 제공될 예정입니다. 기대해주세요!</p>
            </div>
        `;
    },

    // ... (rest of the ui_manager.js code)
};

        app.populateNarratorVoices();
        const voiceSelect = narratorControls.querySelector('#narrator-voice');
        const pitchSlider = narratorControls.querySelector('#narrator-pitch-slider');
        const speedSlider = narratorControls.querySelector('#narrator-speed-slider');
        const pitchValue = narratorControls.querySelector('#narrator-pitch-value');
        const speedValue = narratorControls.querySelector('#narrator-speed-value');

        voiceSelect.value = narrator.voice || 'Charon';
        pitchSlider.value = narrator.pitch || 0.0;
        speedSlider.value = narrator.speed || 1.0;
        pitchValue.textContent = (narrator.pitch || 0.0).toFixed(2);
        speedValue.textContent = (narrator.speed || 1.0).toFixed(2);
    },

    renderBackgrounds() {
        app.elements.backgroundTabs.innerHTML = '';
        if(!app.state.backgrounds) return;
        const bgGroups = app.state.backgrounds.reduce((acc, bg, index) => {
            const groupIndex = Math.floor(index / 2) + 1;
            if (!acc[groupIndex]) acc[groupIndex] = [];
            acc[groupIndex].push(bg);
            return acc;
        }, {});
        Object.keys(bgGroups).forEach(key => {
            const tab = document.createElement('button');
            tab.className = `px-3 py-1 rounded-t-lg text-sm ${app.activeBgTab == key ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'}`;
            tab.textContent = `배경 ${key}`;
            tab.dataset.tabId = key;
            tab.onclick = () => { app.activeBgTab = key; this.renderBackgrounds(); };
            app.elements.backgroundTabs.appendChild(tab);
        });
        app.elements.backgroundReferences.innerHTML = '';
        if (bgGroups[app.activeBgTab]) {
            bgGroups[app.activeBgTab].forEach(bg => {
                app.elements.backgroundReferences.appendChild(this.createReferenceCard(bg, 'background'));
            });
        }
    },

    createReferenceCard(item, type) {
        const card = document.createElement('div');
        card.className = 'bg-gray-700 rounded-lg overflow-hidden shadow-md flex flex-col';
        
        let extraControlsHTML = '';
        if (type === 'character') {
            card.dataset.characterId = item.id;
            const voiceList = app.ttsVoices.filter(v => v.gender === item.gender);
            const createOptions = (voices) => voices.map(v => `<option value="${v.name}" ${item.voice === v.name ? 'selected' : ''}>${app.formatVoiceForDisplay(v.name)}</option>`).join('');
            
            extraControlsHTML = `
            <div class="text-xs text-gray-400 mt-2 flex items-center">
                <input type="text" value="${item.nationality || '한국'}" class="nationality-input bg-gray-600 p-1 rounded w-16" title="국적">
                <span class="ml-2">${item.gender}</span>
            </div>
            <div class="mt-2">
                <div class="flex items-center space-x-2">
                    <select class="w-full bg-gray-600 text-white text-sm rounded p-1 voice-select" title="캐릭터 목소리 종류를 변경합니다.">${createOptions(voiceList)}</select>
                    <button class="voice-preview-btn bg-blue-600 hover:bg-blue-700 p-1 rounded-md text-xs" title="선택된 목소리 미리듣기"><i class="fas fa-play"></i></button>
                    <button class="apply-tts-settings-btn bg-teal-600 hover:bg-teal-500 p-1 rounded-md text-xs" title="현재 목소리 설정을 모든 대사에 적용"><i class="fas fa-broadcast-tower"></i></button>
                </div>
            </div>
            <div class="mt-2 text-xs">
                <div class="grid grid-cols-2 gap-x-2">
                    <div>
                        <label class="text-gray-400">피치: <span class="pitch-value">${item.pitch?.toFixed(2) || '0.00'}</span></label>
                        <input type="range" class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer pitch-slider" min="-2.0" max="2.0" step="0.01" value="${item.pitch || 0.0}" title="목소리 높낮이 조절">
                    </div>
                     <div>
                        <label class="text-gray-400">속도: <span class="speed-value">${item.speed?.toFixed(2) || '1.00'}</span></label>
                        <input type="range" class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer speed-slider" min="0.45" max="1.85" step="0.01" value="${item.speed || 1.0}" title="말하기 속도 조절">
                    </div>
                </div>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
                <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-personality" title="캐릭터 성격 키워드를 수정합니다."><i class="fas fa-user-edit mr-1"></i> 성격</button>
                <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-prompt" title="이미지 생성을 위한 레퍼런스 프롬프트를 수정합니다."><i class="fas fa-file-alt mr-1"></i> 프롬프트</button>
            </div>`;
        } else {
             extraControlsHTML = `<div class="mt-2 grid grid-cols-1 gap-2 text-sm"><button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="edit-prompt" title="배경 이미지 생성을 위한 레퍼런스 프롬프트를 수정합니다."><i class="fas fa-file-alt mr-1"></i> 프롬프트</button></div>`;
        }

        card.innerHTML = `
            <div class="reference-image-container bg-gray-600">
                <img src="${item.image || 'https://placehold.co/540x960/374151/9ca3af?text=No+Image'}" alt="${item.name}" class="cursor-pointer hover:opacity-80 transition-opacity">
            </div>
            <div class="p-3 flex-grow flex flex-col">
                <div class="flex items-center mb-1">
                    <input type="text" value="${item.name}" class="name-input bg-gray-600 rounded-l p-1 text-white font-bold w-full">
                    <button class="apply-char-details-btn bg-green-600 hover:bg-green-700 p-1 rounded-r px-2" title="이름 및 국적 변경 적용"><i class="fas fa-check"></i></button>
                </div>
                 ${extraControlsHTML}
                <div class="mt-auto pt-2 grid grid-cols-3 gap-2 text-sm">
                    <button class="bg-gray-600 hover:bg-gray-500 p-2 rounded transition-colors" data-action="replace" title="내 컴퓨터에서 이미지 업로드"><i class="fas fa-upload mr-1"></i></button>
                    <button class="bg-indigo-600 hover:bg-indigo-500 p-2 rounded transition-colors" data-action="regenerate" title="AI로 이미지 다시 생성"><i class="fas fa-sync-alt mr-1"></i></button>
                    <button class="bg-teal-600 hover:bg-teal-500 p-2 rounded transition-colors" data-action="apply-all" title="현재 캐릭터의 모든 설정을 타임라인에 일괄 적용"><i class="fas fa-check-double mr-1"></i></button>
                </div>
            </div>`;
       
        // Event listeners are bound in app.js after the card is created and appended.
        return card;
    },

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay absolute inset-0 bg-black bg-opacity-70';
        overlay.innerHTML = '<div class="loading-spinner !w-8 !h-8"></div>';
        return overlay;
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            error: 'bg-red-600',
        };
        toast.className = `p-4 rounded-lg text-white shadow-lg transition-all duration-300 transform translate-x-full ${colors[type]}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    },

    // All other UI related functions (modals, timeline rendering, etc.) go here...
    // ...
};
