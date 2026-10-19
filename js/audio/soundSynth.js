/********************************************************************
 * WEB AUDIO API СИНТЕЗАТОР ГОЛОСА И ЭМОЦИЙ EMO + БРАУЗЕРНЫЙ TTS
 ********************************************************************/
class EmoSoundSynth {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.muted = false;
        this.ttsEnabled = true;
        this.loopTimer = null;
        this.vocoderTimer = null;
        this.isSpeakingNow = false;

        this.voiceRate = parseFloat(localStorage.getItem('emo_voice_rate') || '0.84');
        this.voicePitch = parseFloat(localStorage.getItem('emo_voice_pitch') || '0.92');
        this.vocoderLevel = parseFloat(localStorage.getItem('emo_vocoder_level') || '0.65');
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.85;

            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
            compressor.knee.setValueAtTime(20, this.ctx.currentTime);
            compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
            this.masterGain.connect(compressor);
            compressor.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    stopLoops() {
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
    }

    playTone(freqStart, freqEnd, duration = 0.14, type = 'sine', volume = 0.35, delay = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx || !this.masterGain) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(30, freqStart), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    playVocoderSyllablePulse() {
        if (this.muted || this.vocoderLevel <= 0.02) return;
        this.init();
        if (!this.ctx || !this.masterGain) return;

        const now = this.ctx.currentTime;
        const baseFreq = 115 + (this.voicePitch * 65) + (Math.random() - 0.5) * 35;
        const dur = 0.075;
        const vol = 0.13 * this.vocoderLevel;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.linearRampToValueAtTime(baseFreq * 1.12, now + dur);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, now);
        filter.Q.setValueAtTime(4.5, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + dur + 0.01);
        osc2.stop(now + dur + 0.01);
    }

    stopVocoderModulation() {
        this.isSpeakingNow = false;
        if (this.vocoderTimer) {
            clearInterval(this.vocoderTimer);
            this.vocoderTimer = null;
        }
    }

    speakRobotTTS(text) {
        if (!this.ttsEnabled || this.muted || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            this.stopVocoderModulation();

            const cleanText = text.replace(/[^\p{L}\p{N}\s.,!?-]/gu, '').trim();
            if (!cleanText) return;

            const utter = new SpeechSynthesisUtterance(cleanText);
            utter.lang = 'ru-RU';
            utter.rate = this.voiceRate;
            utter.pitch = this.voicePitch;
            utter.volume = 0.95;

            const voices = window.speechSynthesis.getVoices();
            const ruVoice = voices.find(v => v.lang && v.lang.toLowerCase().includes('ru'));
            if (ruVoice) utter.voice = ruVoice;

            utter.onstart = () => {
                this.isSpeakingNow = true;
                this.playVocoderSyllablePulse();
                this.vocoderTimer = setInterval(() => {
                    if (!this.isSpeakingNow || !window.speechSynthesis.speaking) {
                        this.stopVocoderModulation();
                        return;
                    }
                    this.playVocoderSyllablePulse();
                }, 135);
            };

            utter.onboundary = () => {
                this.playVocoderSyllablePulse();
            };

            utter.onend = () => {
                this.stopVocoderModulation();
            };

            utter.onerror = () => {
                this.stopVocoderModulation();
            };

            window.speechSynthesis.speak(utter);
        } catch (e) {
            this.stopVocoderModulation();
        }
    }

    sfxBlink() {
        this.playTone(1350, 780, 0.038, 'sine', 0.12);
    }

    sfxCurious() {
        this.playTone(540, 880, 0.11, 'triangle', 0.34, 0);
        this.playTone(880, 1340, 0.14, 'sine', 0.38, 0.09);
    }

    sfxThinkingTick() {
        const f = 580 + Math.random() * 520;
        this.playTone(f, f * 1.18, 0.06, 'sine', 0.2, 0);
    }

    sfxHappy() {
        const notes = [587.33, 783.99, 987.77, 1174.66, 1567.98];
        notes.forEach((n, i) => {
            this.playTone(n, n * 1.1, 0.09, 'triangle', 0.36, i * 0.065);
        });
    }

    sfxLove() {
        this.playTone(440, 880, 0.25, 'sine', 0.38, 0);
        this.playTone(659.25, 1318.5, 0.32, 'sine', 0.38, 0.15);
        this.playTone(880, 1760, 0.38, 'triangle', 0.32, 0.3);
    }

    sfxAngry() {
        this.playTone(260, 105, 0.22, 'sawtooth', 0.42, 0);
        this.playTone(210, 85, 0.28, 'sawtooth', 0.45, 0.16);
        this.playTone(180, 70, 0.30, 'square', 0.35, 0.34);
    }

    sfxEvilLaugh() {
        const bursts = [620, 560, 500, 450, 400, 350];
        bursts.forEach((f, idx) => {
            this.playTone(f, f * 0.52, 0.13, 'sawtooth', 0.45, idx * 0.14);
            this.playTone(f * 0.5, f * 0.35, 0.13, 'square', 0.25, idx * 0.14);
        });
    }

    sfxSad() {
        this.playTone(620, 380, 0.38, 'sine', 0.38, 0);
        this.playTone(380, 220, 0.55, 'triangle', 0.35, 0.34);
    }

    sfxShock() {
        this.playTone(350, 1950, 0.16, 'sawtooth', 0.42, 0);
        this.playTone(1950, 420, 0.18, 'sine', 0.38, 0.15);
    }

    sfxPurr() {
        this.playTone(220, 310, 0.26, 'sine', 0.32, 0);
        this.playTone(310, 240, 0.26, 'triangle', 0.28, 0.2);
    }

    sfxEat() {
        this.playTone(320, 620, 0.09, 'triangle', 0.38, 0);
        this.playTone(280, 540, 0.09, 'triangle', 0.38, 0.14);
        this.playTone(620, 1100, 0.16, 'sine', 0.36, 0.28);
    }

    sfxSqueak() {
        this.playTone(1300, 2100, 0.12, 'sine', 0.32, 0);
        this.playTone(2100, 1400, 0.12, 'sine', 0.32, 0.13);
    }

    sfxLaser() {
        this.playTone(1800, 160, 0.19, 'sawtooth', 0.45, 0);
    }

    sfxSneeze() {
        this.playTone(420, 1250, 0.22, 'sine', 0.4, 0);
        this.playTone(1500, 130, 0.22, 'sawtooth', 0.5, 0.24);
    }

    sfxGlitch() {
        for (let i = 0; i < 6; i++) {
            const rf = 200 + Math.random() * 2200;
            this.playTone(rf, rf * 0.6, 0.05, 'square', 0.35, i * 0.055);
        }
    }

    sfxAngel() {
        const chord = [523.25, 659.25, 783.99, 1046.5];
        chord.forEach((f, i) => {
            this.playTone(f, f * 1.01, 0.45, 'sine', 0.26, i * 0.06);
        });
    }

    sfxScan() {
        for (let i = 0; i < 6; i++) {
            this.playTone(820 + i * 150, 920 + i * 150, 0.06, 'sine', 0.28, i * 0.07);
        }
    }

    startMusicLoop() {
        this.stopLoops();
        let step = 0;
        const bassNotes = [130.81, 164.81, 196.00, 146.83, 220.00, 164.81, 196.00, 261.63];
        this.loopTimer = setInterval(() => {
            if (currentState !== 'music') {
                this.stopLoops();
                return;
            }
            const note = bassNotes[step % bassNotes.length];
            this.playTone(note, note * 0.5, 0.13, 'sawtooth', 0.34, 0);
            this.playTone(note * 4, note * 2, 0.07, 'triangle', 0.24, 0.11);
            step++;
        }, 230);
    }

    startThinkingLoop() {
        this.stopLoops();
        this.loopTimer = setInterval(() => {
            if (!isThinkingAI) {
                this.stopLoops();
                return;
            }
            this.sfxThinkingTick();
        }, 280);
    }
}

const sound = new EmoSoundSynth();
window.addEventListener('pointerdown', () => sound.init(), { passive: true });
window.addEventListener('keydown', () => sound.init(), { passive: true });
