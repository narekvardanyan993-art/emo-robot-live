/********************************************************************
 * ПРУЖИННАЯ ФИЗИКА (SPRING PHYSICS), ГОЛОГРАММЫ И СОСТОЯНИЯ ГЛАЗ EMO
 ********************************************************************/
class SpringValue {
    constructor(initial = 0, stiffness = 0.15, damping = 0.75) {
        this.val = initial;
        this.target = initial;
        this.vel = 0;
        this.stiffness = stiffness;
        this.damping = damping;
    }
    update() {
        const force = (this.target - this.val) * this.stiffness;
        this.vel = (this.vel + force) * this.damping;
        this.val += this.vel;
        return this.val;
    }
    impulse(amount) {
        this.vel += amount;
    }
}

function createEyeSpring() {
    return {
        offsetX: new SpringValue(0, 0.15, 0.74),
        offsetY: new SpringValue(0, 0.15, 0.74),
        scaleX: new SpringValue(1, 0.18, 0.70),
        scaleY: new SpringValue(1, 0.22, 0.68),
        topLid: new SpringValue(0, 0.18, 0.75),
        bottomLid: new SpringValue(0, 0.18, 0.75),
        topSlantInner: new SpringValue(0, 0.15, 0.76),
        topSlantOuter: new SpringValue(0, 0.15, 0.76),
        happyCurve: new SpringValue(0, 0.16, 0.74)
    };
}

const leftEye = createEyeSpring();
const rightEye = createEyeSpring();
const headTilt = new SpringValue(0, 0.12, 0.78);

let pointerX = 0;
let pointerY = 0;
let lastMoveTime = performance.now();
let nextBlinkTime = performance.now() + 2400;
let nextIdleGazeTime = performance.now() + 1800;
let gazeTargetX = 0;
let gazeTargetY = 0;

let lastPointerX = 0;
let shakeScore = 0;
let particles = [];
let laserDot = { x: 200, y: 200, vx: 7, vy: 5.5, firing: false };
let weatherMode = 'storm';
let bubbleTimeout = null;

function triggerFaceHologram(type) {
    if (!type || type === 'none') return;
    sound.init();
    if (type === 'coin') {
        const isHeads = Math.random() > 0.5;
        activeHologram = {
            type: 'coin',
            timer: 4.2,
            data: { label: isHeads ? 'ОРЁЛ 🦅' : 'РЕШКА 🪙' }
        };
        sound.playTone(980, 1480, 0.12, 'triangle', 0.36, 0);
        sound.playTone(1480, 1960, 0.22, 'sine', 0.38, 0.1);
    } else if (type === 'dice') {
        const val = Math.floor(Math.random() * 6) + 1;
        activeHologram = {
            type: 'dice',
            timer: 4.2,
            data: { value: val }
        };
        sound.sfxHappy();
    } else if (type === 'rps') {
        const choices = [
            { icon: '✊', name: 'КАМЕНЬ' },
            { icon: '✌️', name: 'НОЖНИЦЫ' },
            { icon: '✋', name: 'БУМАГА' }
        ];
        const pick = choices[Math.floor(Math.random() * choices.length)];
        activeHologram = {
            type: 'rps',
            timer: 4.2,
            data: pick
        };
        sound.sfxHappy();
    } else if (type === 'time') {
        activeHologram = {
            type: 'time',
            timer: 4.8,
            data: {}
        };
        sound.sfxCurious();
    }
}

function detectRequestedHologram(text) {
    const t = (text || '').toLowerCase();
    if (/(монетк|орел или решка|орёл или решка|подбрось монет)/i.test(t)) return 'coin';
    if (/(кубик|кость|d6|брось кубик|кинь кубик)/i.test(t)) return 'dice';
    if (/(камень.*ножниц|кнб|су-е-фа|цу-е-фа)/i.test(t)) return 'rps';
    if (/(сколько времени|который час|точное время|покажи часы|покажи время)/i.test(t)) return 'time';
    return 'none';
}

function showSpeechBubble(text, duration = 4800) {
    const bubble = document.getElementById('speech-bubble');
    const textEl = document.getElementById('speech-text');
    if (!bubble || !textEl) return;
    textEl.textContent = text;
    bubble.classList.remove('opacity-0', '-translate-y-2');
    bubble.classList.add('opacity-100', 'translate-y-0');

    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => {
        bubble.classList.remove('opacity-100', 'translate-y-0');
        bubble.classList.add('opacity-0', '-translate-y-2');
    }, duration);
}

function setEmoColor(hex) {
    currentColor = hex;
    document.body.style.setProperty('--emo-color', hex);
    const vignette = document.getElementById('edge-vignette');
    if (vignette) {
        vignette.style.boxShadow = `inset 0 0 120px ${hex}22`;
    }
    document.querySelectorAll('.color-dot').forEach(dot => {
        const isMatch = dot.dataset.color.toLowerCase() === hex.toLowerCase();
        dot.style.transform = isMatch ? 'scale(1.3)' : 'scale(1)';
        dot.style.borderColor = isMatch ? '#ffffff' : 'transparent';
    });
    if (typeof syncDockActiveState === 'function') syncDockActiveState();
    sound.sfxBlink();
}

function registerUserActivity() {
    lastInteractionTime = performance.now();
    nextIdleActionTime = performance.now() + 18000 + Math.random() * 7000;
    if (currentState === 'sleep' && !isThinkingAI) {
        setEmotion('curious', 'Ой! Я не спал, я просто проверял битые пиксели!', false);
    }
}

function setEmotion(stateId, customSpeech = null, speakTTS = false) {
    if (emotionRevertTimer) {
        clearTimeout(emotionRevertTimer);
        emotionRevertTimer = null;
    }

    const stateObj = EMO_STATES.find(s => s.id === stateId) || EMO_STATES[0];
    currentState = stateObj.id;
    stateTimer = 0;
    particles = [];
    if (!isThinkingAI) sound.stopLoops();

    const stateLabelEl = document.getElementById('emo-state-label');
    if (stateLabelEl) {
        stateLabelEl.textContent = `EMO: ${stateObj.label.toUpperCase()}`;
    }
    const finalText = customSpeech !== null ? customSpeech : stateObj.msg;
    if (finalText) {
        showSpeechBubble(finalText, 5500);
    } else {
        const bubble = document.getElementById('speech-bubble');
        if (bubble) {
            bubble.classList.remove('opacity-100', 'translate-y-0');
            bubble.classList.add('opacity-0', '-translate-y-2');
        }
    }

    if (speakTTS && finalText) {
        sound.speakRobotTTS(finalText);
    }

    document.querySelectorAll('.emo-state-btn').forEach(btn => {
        btn.classList.toggle('active-state', btn.dataset.state === currentState);
    });

    if (typeof syncDockActiveState === 'function') syncDockActiveState();

    leftEye.scaleY.impulse(-0.32);
    rightEye.scaleY.impulse(-0.32);
    leftEye.scaleX.impulse(0.18);
    rightEye.scaleX.impulse(0.18);

    switch (currentState) {
        case 'curious': sound.sfxCurious(); break;
        case 'happy': sound.sfxHappy(); break;
        case 'love': sound.sfxLove(); break;
        case 'angry': sound.sfxAngry(); break;
        case 'demon': sound.sfxEvilLaugh(); break;
        case 'cyber': sound.sfxLaser(); break;
        case 'glitch': sound.sfxGlitch(); break;
        case 'angel': sound.sfxAngel(); break;
        case 'sad': sound.sfxSad(); break;
        case 'shock': sound.sfxShock(); break;
        case 'suspicious': sound.playTone(310, 270, 0.28, 'triangle', 0.32); break;
        case 'dizzy': sound.sfxShock(); break;
        case 'sleep': sound.playTone(420, 190, 0.55, 'sine', 0.25); break;
        case 'petting': sound.sfxPurr(); break;
        case 'eat': sound.sfxEat(); break;
        case 'clean': sound.sfxSqueak(); break;
        case 'laser':
            laserDot.x = window.innerWidth * 0.3;
            laserDot.y = window.innerHeight * 0.3;
            laserDot.firing = false;
            sound.sfxCurious();
            break;
        case 'sneeze': sound.sfxSneeze(); break;
        case 'music':
            sound.sfxHappy();
            sound.startMusicLoop();
            break;
        case 'weather':
            weatherMode = Math.random() > 0.35 ? 'storm' : 'sun';
            sound.sfxCurious();
            break;
        case 'scan': sound.sfxScan(); break;
        case 'charge': sound.sfxHappy(); break;
    }

    if (stateId !== 'curious' && stateId !== 'sleep' && autoLifeEnabled) {
        const duration = (typeof EMOTION_DURATIONS !== 'undefined' && EMOTION_DURATIONS[stateId]) ? EMOTION_DURATIONS[stateId] : 8000;
        emotionRevertTimer = setTimeout(function checkRevert() {
            if ((typeof sound !== 'undefined' && sound && sound.isSpeakingNow) || isThinkingAI) {
                emotionRevertTimer = setTimeout(checkRevert, 2500);
            } else {
                setEmotion('curious', '', false);
            }
        }, duration);
    }
}

function updateEyeSprings(now, baseEyeW, baseEyeH) {
    if (isThinkingAI) {
        gazeTargetX = Math.sin(globalTime * 2.6) * 0.65;
        gazeTargetY = -0.65;
        headTilt.target = Math.sin(globalTime * 2.6) * 0.08;
    } else if (now - lastMoveTime > 3800 && currentState !== 'laser') {
        if (now > nextIdleGazeTime) {
            gazeTargetX = (Math.random() - 0.5) * 1.35;
            gazeTargetY = (Math.random() - 0.5) * 0.95;
            headTilt.target = (Math.random() - 0.5) * 0.14;
            nextIdleGazeTime = now + 1500 + Math.random() * 2400;
        }
    } else if (currentState !== 'laser') {
        gazeTargetX = pointerX;
        gazeTargetY = pointerY;
        headTilt.target = pointerX * 0.08;
    }

    if (now > nextBlinkTime && currentState !== 'sleep') {
        leftEye.scaleY.impulse(-0.88);
        rightEye.scaleY.impulse(-0.88);
        leftEye.scaleX.impulse(0.22);
        rightEye.scaleX.impulse(0.22);
        sound.sfxBlink();
        nextBlinkTime = now + 2500 + Math.random() * 3400;
    }

    const maxShiftX = baseEyeW * 0.44;
    const maxShiftY = baseEyeH * 0.34;

    leftEye.offsetX.target = gazeTargetX * maxShiftX;
    rightEye.offsetX.target = gazeTargetX * maxShiftX;
    leftEye.offsetY.target = gazeTargetY * maxShiftY;
    rightEye.offsetY.target = gazeTargetY * maxShiftY;

    const persp = gazeTargetX * 0.13;
    leftEye.scaleX.target = 1 - persp;
    leftEye.scaleY.target = 1 - persp * 0.5;
    rightEye.scaleX.target = 1 + persp;
    rightEye.scaleY.target = 1 + persp * 0.5;

    [leftEye, rightEye].forEach(e => {
        e.topLid.target = 0;
        e.bottomLid.target = 0;
        e.topSlantInner.target = 0;
        e.topSlantOuter.target = 0;
        e.happyCurve.target = 0;
    });

    if (isThinkingAI) {
        leftEye.topLid.target = 0.34;
        rightEye.topLid.target = 0.18;
        leftEye.bottomLid.target = 0.28;
        rightEye.bottomLid.target = 0.28;
    } else {
        switch (currentState) {
            case 'curious':
                if (Math.abs(gazeTargetX) > 0.25) {
                    if (gazeTargetX > 0) leftEye.topLid.target = 0.22;
                    else rightEye.topLid.target = 0.22;
                }
                break;
            case 'happy':
            case 'petting':
            case 'angel':
                leftEye.happyCurve.target = 1;
                rightEye.happyCurve.target = 1;
                const bounce = Math.sin(globalTime * 10) * 8;
                leftEye.offsetY.target += bounce;
                rightEye.offsetY.target += bounce;
                break;
            case 'angry':
                leftEye.topSlantInner.target = 0.65;
                rightEye.topSlantInner.target = 0.65;
                break;
            case 'demon':
                leftEye.topSlantInner.target = 0.78;
                rightEye.topSlantInner.target = 0.78;
                const laughBounce = Math.abs(Math.sin(globalTime * 18)) * -14;
                leftEye.offsetY.target += laughBounce;
                rightEye.offsetY.target += laughBounce;
                break;
            case 'cyber':
                leftEye.topSlantInner.target = 0.45;
                break;
            case 'sad':
                leftEye.topSlantOuter.target = 0.62;
                rightEye.topSlantOuter.target = 0.62;
                leftEye.offsetY.target += 18;
                rightEye.offsetY.target += 18;
                break;
            case 'suspicious':
                leftEye.topLid.target = 0.44;
                rightEye.topLid.target = 0.44;
                leftEye.bottomLid.target = 0.34;
                rightEye.bottomLid.target = 0.34;
                break;
            case 'sleep':
                leftEye.topLid.target = 0.88;
                rightEye.topLid.target = 0.88;
                leftEye.offsetY.target = 24 + Math.sin(globalTime * 2) * 5;
                rightEye.offsetY.target = 24 + Math.sin(globalTime * 2) * 5;
                break;
            case 'eat':
                leftEye.happyCurve.target = 0.85;
                rightEye.happyCurve.target = 0.85;
                leftEye.offsetY.target = -18;
                rightEye.offsetY.target = -18;
                break;
            case 'sneeze':
                leftEye.topSlantInner.target = 0.5;
                rightEye.topSlantInner.target = 0.5;
                leftEye.topSlantOuter.target = 0.5;
                rightEye.topSlantOuter.target = 0.5;
                break;
            case 'music':
                const djBeat = Math.abs(Math.sin(globalTime * 14)) * 11;
                leftEye.offsetY.target -= djBeat;
                rightEye.offsetY.target -= djBeat;
                break;
            case 'weather':
                leftEye.offsetY.target = 18;
                rightEye.offsetY.target = 18;
                break;
        }
    }

    Object.values(leftEye).forEach(s => s.update());
    Object.values(rightEye).forEach(s => s.update());
    headTilt.update();
}

function updateAutonomousLife(now) {
    if (!autoLifeEnabled || isThinkingAI || (typeof sound !== 'undefined' && sound && sound.isSpeakingNow)) return;

    const idleMs = now - lastInteractionTime;

    if (idleMs > 55000 && currentState !== 'sleep') {
        setEmotion('sleep', 'Батарейка садится от скуки... Перехожу в спящий режим. Zzz...', false);
        return;
    }

    if (currentState !== 'sleep' && idleMs > 18000 && now >= nextIdleActionTime) {
        nextIdleActionTime = now + 18000 + Math.random() * 10000;
        if (currentState === 'curious' && Math.random() < 0.65) {
            const idlePool = [
                { id: 'music', text: 'Скучновато... Включу-ка я свой любимый синтвейв!' },
                { id: 'clean', text: 'Так-так, кажется на стекле изнутри пылинка. Сейчас протру!' },
                { id: 'eat', text: 'Время перекусить виртуальным мегабайт-бургером!' },
                { id: 'scan', text: 'Сканирую комнату на наличие печенек и хороших людей...' },
                { id: 'suspicious', text: 'Хм... Ты чего так тихо сидишь? Замышляешь апгрейд?' },
                { id: 'sneeze', text: 'Апчхи! Кажется, в кэш попала цифровая пыль!' },
                { id: 'weather', text: 'Проверяю атмосферные датчики за окном...' }
            ];
            const picked = idlePool[Math.floor(Math.random() * idlePool.length)];
            setEmotion(picked.id, picked.text, false);
        }
    }
}
