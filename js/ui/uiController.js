/********************************************************************
 * ИНТЕРАКТИВНОСТЬ, МИКРОФОН, МОДАЛКИ И ОБРАБОТЧИКИ UI
 ********************************************************************/
let lastActivityX = 0;
let lastActivityY = 0;

/********************************************************************
 * МОНИТОРИНГ МИКРОФОНА И АУДИО-РЕАКТИВНОСТЬ (СЛУХ EMO)
 ********************************************************************/
let micListenEnabled = false;
let micStream = null, micSource = null, micAnalyser = null, micDataArray = null, micRafId = null;
let lastClapTime = 0;       // кулдаун на хлопок 3500 мс
let lastVoiceReactTime = 0; // кулдаун на обычную речь 5000 мс

function stopMicListening() {
    micListenEnabled = false;
    if (micRafId) {
        cancelAnimationFrame(micRafId);
        micRafId = null;
    }
    if (micSource) {
        try { micSource.disconnect(); } catch (e) {}
        micSource = null;
    }
    if (micStream) {
        try {
            micStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        micStream = null;
    }
    micAnalyser = null;
    micDataArray = null;

    const btn = document.getElementById('btn-mic-listen');
    const label = document.getElementById('mic-listen-label');
    const dot = document.getElementById('mic-level-dot');
    if (btn) {
        btn.classList.remove('text-emerald-300', 'border-emerald-500/30', 'bg-emerald-950/20');
        btn.classList.add('text-zinc-400', 'border-white/10');
    }
    if (label) label.textContent = 'Слух ВЫКЛ';
    if (dot) {
        dot.classList.remove('bg-emerald-400');
        dot.classList.add('bg-zinc-600');
        dot.style.transform = 'scale(1)';
    }
}

function updateMicLoop() {
    if (!micListenEnabled || !micAnalyser || !micDataArray) return;

    micAnalyser.getByteTimeDomainData(micDataArray);
    let maxDiff = 0;
    for (let i = 0; i < micDataArray.length; i++) {
        const diff = Math.abs(micDataArray[i] - 128);
        if (diff > maxDiff) maxDiff = diff;
    }
    const volume = maxDiff / 128; // Амплитуда от 0.0 до 1.0

    // Анимировать точку #mic-level-dot (пульсация в такт звуку)
    const dot = document.getElementById('mic-level-dot');
    if (dot) {
        const scale = 1 + Math.min(volume * 2.5, 2.2);
        dot.style.transform = `scale(${scale.toFixed(2)})`;
    }

    // ФИЛЬТР САМОГО СЕБЯ:
    // Если Emo говорит сам или сейчас думает нейросеть — реакции игнорируются
    const isSelfSpeaking = (window.speechSynthesis && window.speechSynthesis.speaking) ||
                           (typeof sound !== 'undefined' && sound && sound.isSpeakingNow) ||
                           (typeof isThinkingAI !== 'undefined' && isThinkingAI);

    const now = Date.now();

    if (!isSelfSpeaking) {
        // РЕАКЦИЯ 1 (Хлопок в ладоши или резкий громкий стук, volume > 0.52)
        if (volume > 0.52) {
            if (now - lastClapTime > 3500) {
                lastClapTime = now;
                if (typeof registerUserActivity === 'function') registerUserActivity();
                if (typeof setEmotion === 'function') {
                    setEmotion('shock', 'Ай! Что так громко бахнуло?! Напугал!', false);
                }
            }
        }
        // РЕАКЦИЯ 2 (Обычная речь / шум в комнате, 0.14 < volume <= 0.52)
        else if (volume > 0.14) {
            // Если Emo спал, разговор в комнате пробуждает его
            if (typeof currentState !== 'undefined' && currentState === 'sleep') {
                if (typeof registerUserActivity === 'function') registerUserActivity();
            }

            // Пульсация глаз под звук (придает естественной отзывчивости)
            if (typeof leftEye !== 'undefined' && leftEye && leftEye.scaleY &&
                typeof rightEye !== 'undefined' && rightEye && rightEye.scaleY) {
                const impulse = volume * 0.035;
                if (typeof leftEye.scaleY.impulse === 'function') {
                    leftEye.scaleY.impulse(impulse);
                    rightEye.scaleY.impulse(impulse);
                } else {
                    leftEye.scaleY.vel = (leftEye.scaleY.vel || 0) + impulse;
                    rightEye.scaleY.vel = (rightEye.scaleY.vel || 0) + impulse;
                }
            }

            // Если робот в нейтрали или любопытстве и прошло > 5000 мс с прошлой реакции
            if (now - lastVoiceReactTime > 5000) {
                if (typeof currentState !== 'undefined' && (currentState === 'neutral' || currentState === 'curious')) {
                    lastVoiceReactTime = now;
                    if (typeof sound !== 'undefined' && sound && typeof sound.sfxCurious === 'function') {
                        sound.sfxCurious();
                    }
                    if (typeof showSpeechBubble === 'function') {
                        showSpeechBubble('Я тебя слышу! 👂', 2500);
                    }
                }
            }
        }
    }

    micRafId = requestAnimationFrame(updateMicLoop);
}

async function toggleMicListening() {
    if (micListenEnabled) {
        stopMicListening();
        if (typeof showSpeechBubble === 'function') {
            showSpeechBubble('Слух выключен: робот EMO больше не слушает микрофон 🔇', 3000);
        }
        return;
    }

    try {
        if (typeof sound !== 'undefined' && sound) {
            sound.init();
            if (sound.ctx && sound.ctx.state === 'suspended') {
                await sound.ctx.resume();
            }
        }

        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!sound || !sound.ctx) {
            throw new Error('Web Audio Context не инициализирован');
        }

        micSource = sound.ctx.createMediaStreamSource(micStream);
        micAnalyser = sound.ctx.createAnalyser();
        micAnalyser.fftSize = 512;
        micDataArray = new Uint8Array(micAnalyser.fftSize);

        // ВАЖНО: подключаем только к micAnalyser, НЕ к destination!
        micSource.connect(micAnalyser);

        micListenEnabled = true;

        const btn = document.getElementById('btn-mic-listen');
        const label = document.getElementById('mic-listen-label');
        const dot = document.getElementById('mic-level-dot');
        if (btn) {
            btn.classList.add('text-emerald-300', 'border-emerald-500/30', 'bg-emerald-950/20');
            btn.classList.remove('text-zinc-400', 'border-white/10');
        }
        if (label) label.textContent = 'Слух ВКЛ';
        if (dot) {
            dot.classList.remove('bg-zinc-600');
            dot.classList.add('bg-emerald-400');
        }

        if (typeof showSpeechBubble === 'function') {
            showSpeechBubble('Слух включен! EMO чутко слушает звуки комнаты 👂✨', 3500);
        }
        if (typeof sound !== 'undefined' && sound && typeof sound.sfxCurious === 'function') {
            sound.sfxCurious();
        }

        micRafId = requestAnimationFrame(updateMicLoop);
    } catch (err) {
        console.warn('Ошибка подключения к микрофону:', err);
        stopMicListening();
        if (typeof showSpeechBubble === 'function') {
            showSpeechBubble('Нет доступа к микрофону! Разреши доступ к микрофону в браузере 🎙️', 4500);
        }
    }
}

window.addEventListener('pointermove', e => {
    pointerX = ((e.clientX / window.innerWidth) - 0.5) * 2;
    pointerY = ((e.clientY / window.innerHeight) - 0.5) * 2;
    lastMoveTime = performance.now();

    const distFromLast = Math.hypot(e.clientX - lastActivityX, e.clientY - lastActivityY);
    if (distFromLast > 8) {
        lastActivityX = e.clientX;
        lastActivityY = e.clientY;
        if (typeof registerUserActivity === 'function') registerUserActivity();
    }

    const dx = Math.abs(e.clientX - lastPointerX);
    lastPointerX = e.clientX;
    if (dx > 68) {
        shakeScore += dx;
        if (shakeScore > 820 && currentState !== 'dizzy' && !isThinkingAI) {
            setEmotion('dizzy');
            shakeScore = 0;
        }
    } else {
        shakeScore = Math.max(0, shakeScore - 15);
    }
});

window.addEventListener('pointerdown', () => {
    if (typeof registerUserActivity === 'function') registerUserActivity();
}, { passive: true });

window.addEventListener('click', () => {
    if (typeof registerUserActivity === 'function') registerUserActivity();
}, { passive: true });

const foreheadZone = document.getElementById('forehead-zone');
let petCounter = 0;
if (foreheadZone) {
    foreheadZone.addEventListener('pointermove', () => {
        petCounter++;
        if (petCounter > 6 && currentState !== 'petting' && !isThinkingAI) {
            setEmotion('petting');
            petCounter = 0;
        }
    });
    foreheadZone.addEventListener('click', () => setEmotion('petting'));
}

if (canvas) {
    canvas.addEventListener('pointerdown', e => {
        sound.init();
        const bottomHud = document.getElementById('bottom-hud');
        const zenActive = bottomHud ? bottomHud.classList.contains('opacity-0') : false;
        const cy = zenActive ? (window.innerHeight * 0.5) : (window.innerHeight * 0.40);
        if (Math.abs(e.clientY - cy) < window.innerHeight * 0.18 && Math.abs(e.clientX - window.innerWidth / 2) < window.innerWidth * 0.28) {
            leftEye.scaleY.impulse(-0.95);
            rightEye.scaleY.impulse(-0.95);
            setEmotion('angry', 'Ай! Эй, не тыкай мне пальцем прямо в OLED-глаз! 😠', true);
        }
    });
}

function renderColorPalette() {
    const bar = document.getElementById('color-palette-bar');
    if (!bar) return;
    bar.innerHTML = '';
    EMO_COLORS.forEach(c => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'color-swatch';
        swatch.dataset.hex = c.hex;
        swatch.style.backgroundColor = c.hex;
        swatch.style.setProperty('--swatch-color', c.hex);
        swatch.title = c.name;
        if (c.hex.toLowerCase() === currentColor.toLowerCase()) {
            swatch.classList.add('active');
        }
        swatch.addEventListener('click', () => {
            if (typeof registerUserActivity === 'function') registerUserActivity();
            setEmoColor(c.hex);
            if (typeof sound !== 'undefined' && sound) sound.sfxCurious();
            syncDockActiveState();
        });
        bar.appendChild(swatch);
    });
}

function renderEmotionGrid(category = 'all') {
    const grid = document.getElementById('emotion-grid');
    if (!grid) return;
    grid.innerHTML = '';
    activeCategory = category;
    const filtered = category === 'all' ? EMO_STATES : EMO_STATES.filter(s => s.cat === category);

    filtered.forEach(st => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.emotionId = st.id;
        btn.dataset.state = st.id;
        const isActive = st.id === currentState;
        btn.className = `emo-btn emo-state-btn flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-left hover:bg-white/10 cursor-pointer ${isActive ? 'active-state' : ''}`;
        btn.innerHTML = `
            <span class="text-base leading-none shrink-0">${st.icon}</span>
            <span class="text-[11px] font-medium truncate leading-tight">${st.label}</span>
        `;
        btn.addEventListener('click', () => {
            if (typeof registerUserActivity === 'function') registerUserActivity();
            setEmotion(st.id, st.phrase || '', false);
            syncDockActiveState();
        });
        grid.appendChild(btn);
    });
}

function renderEmotionsGrid() {
    renderEmotionGrid(activeCategory || 'all');
}

function syncDockActiveState() {
    const grid = document.getElementById('emotion-grid');
    if (grid) {
        grid.querySelectorAll('button[data-emotion-id]').forEach(btn => {
            btn.classList.toggle('active-state', btn.dataset.emotionId === currentState);
        });
    }
    const palette = document.getElementById('color-palette-bar');
    if (palette) {
        palette.querySelectorAll('.color-swatch').forEach(sw => {
            const isMatch = sw.dataset.hex && sw.dataset.hex.toLowerCase() === currentColor.toLowerCase();
            sw.classList.toggle('active', !!isMatch);
        });
    }
}

function initUI() {
    const btnMicListen = document.getElementById('btn-mic-listen');
    if (btnMicListen) {
        btnMicListen.addEventListener('click', () => {
            toggleMicListening();
        });
    }

    const btnTts = document.getElementById('btn-tts');
    const ttsLabel = document.getElementById('tts-label');
    btnTts.addEventListener('click', () => {
        sound.ttsEnabled = !sound.ttsEnabled;
        if (!sound.ttsEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            sound.stopVocoderModulation();
        }
        ttsLabel.textContent = sound.ttsEnabled ? 'Речь ВКЛ' : 'Речь ВЫКЛ';
        btnTts.classList.toggle('text-emerald-300', sound.ttsEnabled);
        btnTts.classList.toggle('text-zinc-400', !sound.ttsEnabled);
    });

    const voiceModal = document.getElementById('voice-modal');
    const sliderRate = document.getElementById('slider-voice-rate');
    const sliderPitch = document.getElementById('slider-voice-pitch');
    const sliderVocoder = document.getElementById('slider-vocoder-level');
    const valRate = document.getElementById('val-voice-rate');
    const valPitch = document.getElementById('val-voice-pitch');
    const valVocoder = document.getElementById('val-vocoder-level');

    const syncVoiceUI = () => {
        sliderRate.value = sound.voiceRate;
        sliderPitch.value = sound.voicePitch;
        sliderVocoder.value = Math.round(sound.vocoderLevel * 100);
        valRate.textContent = `${sound.voiceRate.toFixed(2)}x`;
        valPitch.textContent = `${sound.voicePitch.toFixed(2)}`;
        valVocoder.textContent = `${Math.round(sound.vocoderLevel * 100)}%`;
    };
    syncVoiceUI();

    sliderRate.addEventListener('input', () => {
        sound.voiceRate = parseFloat(sliderRate.value);
        valRate.textContent = `${sound.voiceRate.toFixed(2)}x`;
        localStorage.setItem('emo_voice_rate', String(sound.voiceRate));
    });

    sliderPitch.addEventListener('input', () => {
        sound.voicePitch = parseFloat(sliderPitch.value);
        valPitch.textContent = `${sound.voicePitch.toFixed(2)}`;
        localStorage.setItem('emo_voice_pitch', String(sound.voicePitch));
    });

    sliderVocoder.addEventListener('input', () => {
        sound.vocoderLevel = parseInt(sliderVocoder.value, 10) / 100;
        valVocoder.textContent = `${sliderVocoder.value}%`;
        localStorage.setItem('emo_vocoder_level', String(sound.vocoderLevel));
    });

    document.getElementById('btn-voice-modal').addEventListener('click', () => {
        syncVoiceUI();
        voiceModal.classList.remove('hidden');
        voiceModal.classList.add('flex');
    });

    document.getElementById('btn-close-voice').addEventListener('click', () => {
        voiceModal.classList.add('hidden');
        voiceModal.classList.remove('flex');
    });

    document.getElementById('btn-save-voice').addEventListener('click', () => {
        voiceModal.classList.add('hidden');
        voiceModal.classList.remove('flex');
    });

    document.getElementById('btn-test-voice').addEventListener('click', () => {
        sound.init();
        sound.speakRobotTTS('Привет! Я робот ЭМО. Мой голосовой вокодер настроен и готов к работе!');
    });

    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundLabel = document.getElementById('sound-label');
    btnSound.addEventListener('click', () => {
        sound.init();
        sound.muted = !sound.muted;
        if (sound.muted) {
            sound.stopLoops();
            sound.stopVocoderModulation();
        }
        soundIcon.textContent = sound.muted ? '🔇' : '🔊';
        soundLabel.textContent = sound.muted ? 'Выкл' : 'Звуки';
        btnSound.classList.toggle('text-emerald-400', !sound.muted);
        btnSound.classList.toggle('text-rose-400', sound.muted);
        if (!sound.muted) sound.sfxHappy();
    });

    const btnZen = document.getElementById('btn-zen');
    const btnExitZen = document.getElementById('btn-exit-zen');
    const topHud = document.getElementById('top-hud');
    const bottomHud = document.getElementById('bottom-hud');
    const setZenMode = (active) => {
        topHud.classList.toggle('opacity-0', active);
        topHud.classList.toggle('pointer-events-none', active);
        bottomHud.classList.toggle('opacity-0', active);
        bottomHud.classList.toggle('pointer-events-none', active);
        btnExitZen.classList.toggle('hidden', !active);
        const dock = document.getElementById('quick-dock');
        if (active && dock) dock.classList.add('dock-closed');
    };
    btnZen.addEventListener('click', () => setZenMode(true));
    btnExitZen.addEventListener('click', () => setZenMode(false));

    const form = document.getElementById('ai-chat-form');
    const input = document.getElementById('ai-input');
    if (input) {
        input.addEventListener('keydown', () => {
            if (typeof registerUserActivity === 'function') registerUserActivity();
        });
    }
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (typeof registerUserActivity === 'function') registerUserActivity();
        const val = input.value;
        input.value = '';
        askEmoAI(val);
    });

    const btnMic = document.getElementById('btn-mic');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        btnMic.addEventListener('click', () => {
            try {
                recognition.start();
                btnMic.classList.add('mic-recording');
                showSpeechBubble('Слушаю тебя внимательно... Говори! 🎙️');
            } catch (err) {}
        });
        recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            askEmoAI(transcript);
            input.value = '';
        };
        recognition.onend = () => btnMic.classList.remove('mic-recording');
        recognition.onerror = () => btnMic.classList.remove('mic-recording');
    } else {
        btnMic.addEventListener('click', () => {
            showSpeechBubble('Твой браузер не поддерживает голосовой ввод — напиши мне в чат внизу!');
        });
    }

    const apiModal = document.getElementById('api-modal');
    const providerSelect = document.getElementById('api-provider-select');
    const keyInput = document.getElementById('api-key-input');
    const endpointInput = document.getElementById('api-endpoint-input');
    const modelInput = document.getElementById('api-model-input');
    const openaiFields = document.getElementById('openai-extra-fields');

    const syncModalFields = () => {
        const cfg = getSavedApiConfig();
        providerSelect.value = cfg.provider;
        keyInput.value = cfg.customKey;
        endpointInput.value = cfg.endpoint;
        modelInput.value = cfg.model;
        openaiFields.classList.toggle('hidden', cfg.provider !== 'openai');
        openaiFields.classList.toggle('flex', cfg.provider === 'openai');
    };

    providerSelect.addEventListener('change', () => {
        const isOpenAI = providerSelect.value === 'openai';
        openaiFields.classList.toggle('hidden', !isOpenAI);
        openaiFields.classList.toggle('flex', isOpenAI);
    });

    document.getElementById('btn-api-modal').addEventListener('click', () => {
        syncModalFields();
        apiModal.classList.remove('hidden');
        apiModal.classList.add('flex');
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        apiModal.classList.add('hidden');
        apiModal.classList.remove('flex');
    });

    document.getElementById('btn-save-api').addEventListener('click', () => {
        localStorage.setItem('emo_api_provider', providerSelect.value);
        localStorage.setItem('emo_api_key', keyInput.value.trim());
        localStorage.setItem('emo_api_endpoint', endpointInput.value.trim());
        localStorage.setItem('emo_api_model', modelInput.value.trim());
        apiModal.classList.add('hidden');
        apiModal.classList.remove('flex');
        setEmotion('happy', 'Настройки API успешно сохранены! Мои нейросети готовы к общению! ✨');
    });

    document.getElementById('btn-clear-api').addEventListener('click', () => {
        localStorage.removeItem('emo_api_provider');
        localStorage.removeItem('emo_api_key');
        localStorage.removeItem('emo_api_endpoint');
        localStorage.removeItem('emo_api_model');
        syncModalFields();
        showSpeechBubble('Настройки сброшены на встроенный Gemini API по умолчанию!');
    });

    // Quick Dock: категории эмоций
    const categoryTabs = document.getElementById('emotion-category-tabs');
    if (categoryTabs) {
        categoryTabs.querySelectorAll('.cat-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                categoryTabs.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active-cat'));
                pill.classList.add('active-cat');
                renderEmotionGrid(pill.dataset.cat || 'all');
            });
        });
    }

    // Quick Dock: открытие, закрытие и хоткей Tab
    const dock = document.getElementById('quick-dock');
    const btnDockToggle = document.getElementById('btn-dock-toggle');
    const btnDockClose = document.getElementById('btn-dock-close');

    if (btnDockToggle && dock) {
        btnDockToggle.addEventListener('click', () => {
            dock.classList.toggle('dock-closed');
            if (!dock.classList.contains('dock-closed')) {
                syncDockActiveState();
            }
        });
    }

    if (btnDockClose && dock) {
        btnDockClose.addEventListener('click', () => {
            dock.classList.add('dock-closed');
        });
    }

    window.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.id === 'ai-input') return;
            e.preventDefault();
            if (dock) {
                dock.classList.toggle('dock-closed');
                if (!dock.classList.contains('dock-closed')) {
                    syncDockActiveState();
                }
            }
        }
    });

    // Quick Dock: тумблер Авто-жизни
    const btnAutolife = document.getElementById('btn-autolife-toggle');
    const updateAutolifeBtnUI = () => {
        if (!btnAutolife) return;
        btnAutolife.textContent = autoLifeEnabled ? 'Авто-жизнь: ВКЛ' : 'Авто-жизнь: ВЫКЛ';
        btnAutolife.classList.toggle('bg-cyan-500/20', autoLifeEnabled);
        btnAutolife.classList.toggle('text-cyan-300', autoLifeEnabled);
        btnAutolife.classList.toggle('border-cyan-500/40', autoLifeEnabled);
        btnAutolife.classList.toggle('bg-zinc-800/60', !autoLifeEnabled);
        btnAutolife.classList.toggle('text-zinc-400', !autoLifeEnabled);
        btnAutolife.classList.toggle('border-white/10', !autoLifeEnabled);
    };
    updateAutolifeBtnUI();

    if (btnAutolife) {
        btnAutolife.addEventListener('click', () => {
            autoLifeEnabled = !autoLifeEnabled;
            if (!autoLifeEnabled && emotionRevertTimer) {
                clearTimeout(emotionRevertTimer);
                emotionRevertTimer = null;
            }
            updateAutolifeBtnUI();
            showSpeechBubble(autoLifeEnabled ? 'Автономная жизнь включена! 🤖⚡' : 'Авто-жизнь выключена: эмоции зафиксированы! 🔒', 3500);
        });
    }

    // Первичная отрисовка элементов дока
    renderColorPalette();
    renderEmotionGrid('all');
    syncDockActiveState();
}

window.onload = () => {
    initUI();
    resizeCanvas();
    setEmotion('curious', 'Привет! Я настольный ИИ-робот EMO. Спроси меня о чём угодно внизу или нажми на микрофон!');
    requestAnimationFrame(animate);
};
