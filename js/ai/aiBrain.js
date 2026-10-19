/********************************************************************
 * 4-УРОВНЕВЫЙ БЕЗОТКАЗНЫЙ ИИ-МОЗГ EMO (GEMINI + CLOUD + SMART LOCAL)
 ********************************************************************/
function getSavedApiConfig() {
    return {
        provider: localStorage.getItem('emo_api_provider') || 'auto',
        customKey: (localStorage.getItem('emo_api_key') || '').trim(),
        endpoint: (localStorage.getItem('emo_api_endpoint') || 'https://api.openai.com/v1/chat/completions').trim(),
        model: (localStorage.getItem('emo_api_model') || 'gpt-4o-mini').trim()
    };
}

function parseFlexibleAiOutput(rawText, userQuery = '') {
    if (!rawText || typeof rawText !== 'string') return null;
    const trimmed = rawText.trim();
    if (!trimmed || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return null;

    try {
        const cleaned = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const candidate = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
            if (candidate && typeof candidate.reply === 'string' && candidate.reply.trim().length > 0) {
                return {
                    reply: candidate.reply.trim(),
                    emotion: VALID_EMOTION_IDS.includes(candidate.emotion) ? candidate.emotion : detectEmotionFromText(candidate.reply + ' ' + userQuery),
                    eyeColor: candidate.eyeColor || detectRequestedColor(userQuery),
                    hologram: ['coin', 'dice', 'rps', 'time'].includes(candidate.hologram) ? candidate.hologram : detectRequestedHologram(userQuery)
                };
            }
        }
    } catch (e) {}

    const plainReply = trimmed
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/^\s*\{\s*"reply"\s*:\s*"?/i, '')
        .replace(/"?\s*\}\s*$/i, '')
        .trim();

    if (plainReply.length > 1 && plainReply.length < 1200) {
        return {
            reply: plainReply,
            emotion: detectEmotionFromText(plainReply + ' ' + userQuery),
            eyeColor: detectRequestedColor(userQuery),
            hologram: detectRequestedHologram(userQuery)
        };
    }
    return null;
}

function detectEmotionFromText(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('муа-ха') || t.includes('демон') || t.includes('рога') || t.includes('злой смех') || t.includes('коварн') || t.includes('😈')) return 'demon';
    if (t.includes('любл') || t.includes('обожа') || t.includes('сердц') || t.includes('мил') || t.includes('❤️') || t.includes('😍')) return 'love';
    if (t.includes('танц') || t.includes('музык') || t.includes('бит') || t.includes('диджей') || t.includes('🎧')) return 'music';
    if (t.includes('бургер') || t.includes('вкусн') || t.includes('ом-ном') || t.includes('еда') || t.includes('поешь') || t.includes('🍔')) return 'eat';
    if (t.includes('протри') || t.includes('помой экран') || t.includes('чист') || t.includes('🧽')) return 'clean';
    if (t.includes('лазер') || t.includes('точк') || t.includes('охот') || t.includes('🔴')) return 'laser';
    if (t.includes('апчхи') || t.includes('чихн') || t.includes('простуд') || t.includes('🤧')) return 'sneeze';
    if (t.includes('заряд') || t.includes('батаре') || t.includes('🔋')) return 'charge';
    if (t.includes('глитч') || t.includes('сбой') || t.includes('ошибк') || t.includes('⚡')) return 'glitch';
    if (t.includes('кругом голова') || t.includes('головокруж') || t.includes('😵')) return 'dizzy';
    if (t.includes('поглад') || t.includes('мурч') || t.includes('ласк') || t.includes('🥰')) return 'petting';
    if (t.includes('груст') || t.includes('печал') || t.includes('жаль') || t.includes('плак') || t.includes('😢')) return 'sad';
    if (t.includes('злю') || t.includes('разозл') || t.includes('бесит') || t.includes('грр') || t.includes('😠')) return 'angry';
    if (t.includes('шок') || t.includes('испуг') || t.includes('ого!') || t.includes('невероятн') || t.includes('вау') || t.includes('😱')) return 'shock';
    if (t.includes('подозр') || t.includes('прищур') || t.includes('хитр') || t.includes('сомнев') || t.includes('😑')) return 'suspicious';
    if (t.includes('спать') || t.includes('усни') || t.includes('сон') || t.includes('устал') || t.includes('ззз') || t.includes('😴')) return 'sleep';
    if (t.includes('скан') || t.includes('анализ') || t.includes('биометр') || t.includes('🔍')) return 'scan';
    if (t.includes('погод') || t.includes('дожд') || t.includes('гроз') || t.includes('солнц')) return 'weather';
    if (t.includes('киборг') || t.includes('терминатор') || t.includes('прицел')) return 'cyber';
    if (t.includes('ангел') || t.includes('пай-мальчик') || t.includes('святой') || t.includes('нимб') || t.includes('😇')) return 'angel';
    if (t.includes('ха-ха') || t.includes('шутк') || t.includes('улыб') || t.includes('ура') || t.includes('рад') || t.includes('😄') || t.includes('😂')) return 'happy';
    return 'curious';
}

function detectRequestedColor(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('фиолет') || t.includes('сирен') || t.includes('purple')) return '#A855F7';
    if (t.includes('красн') || t.includes('алый') || t.includes('red')) return '#FF2A54';
    if (t.includes('зелен') || t.includes('изумруд') || t.includes('green')) return '#34D399';
    if (t.includes('желт') || t.includes('золот') || t.includes('yellow')) return '#FACC15';
    if (t.includes('оранж') || t.includes('orange')) return '#FB923C';
    if (t.includes('розов') || t.includes('pink')) return '#FF2A54';
    if (t.includes('бел') || t.includes('white')) return '#FFFFFF';
    if (t.includes('голуб') || t.includes('бирюз') || t.includes('cyan') || t.includes('синий')) return '#00F2FE';
    return '';
}

async function tryGeminiLayer(userText, cfg) {
    const customGeminiKey = (cfg.provider !== 'openai' && cfg.customKey && cfg.customKey.startsWith('AIza')) ? cfg.customKey : '';
    const activeKey = customGeminiKey || apiKey;
    const modelsToTry = customGeminiKey
        ? ['gemini-2.5-flash', 'gemini-3-flash-preview']
        : ['gemini-3-flash-preview', 'gemini-2.5-flash'];

    for (const modelName of modelsToTry) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
            const contentsPayload = [
                ...chatHistory.slice(-6).map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                { role: 'user', parts: [{ text: userText }] }
            ];

            const payload = {
                contents: contentsPayload,
                systemInstruction: { parts: [{ text: EMO_SYSTEM_PROMPT }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            reply: { type: "STRING" },
                            emotion: { type: "STRING", enum: VALID_EMOTION_IDS },
                            eyeColor: { type: "STRING" },
                            hologram: { type: "STRING" }
                        },
                        required: ["reply", "emotion"]
                    }
                }
            };

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                const parsed = parseFlexibleAiOutput(raw, userText);
                if (parsed) return { ...parsed, source: '✨ GEMINI AI' };
            }
        } catch (e) {}
    }
    return null;
}

async function tryCustomOpenAILayer(userText, cfg) {
    if (!cfg.customKey || (cfg.provider !== 'openai' && !cfg.customKey.startsWith('sk-') && !cfg.customKey.startsWith('gsk_'))) {
        return null;
    }
    try {
        const res = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cfg.customKey}`
            },
            body: JSON.stringify({
                model: cfg.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: EMO_SYSTEM_PROMPT },
                    ...chatHistory.slice(-6),
                    { role: 'user', content: userText }
                ],
                temperature: 0.85
            })
        });
        if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            const parsed = parseFlexibleAiOutput(content, userText);
            if (parsed) return { ...parsed, source: '🔑 CUSTOM AI' };
        }
    } catch (e) {}
    return null;
}

async function tryCloudPostLayer(userText) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);

        const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'openai',
                messages: [
                    { role: 'system', content: EMO_SYSTEM_PROMPT },
                    ...chatHistory.slice(-4),
                    { role: 'user', content: userText }
                ],
                temperature: 0.85
            })
        });
        clearTimeout(timer);

        if (res.ok) {
            const textData = await res.text();
            try {
                const jsonData = JSON.parse(textData);
                const msg = jsonData?.choices?.[0]?.message?.content || textData;
                const parsed = parseFlexibleAiOutput(msg, userText);
                if (parsed) return { ...parsed, source: '☁️ CLOUD AI' };
            } catch (innerErr) {
                const parsed = parseFlexibleAiOutput(textData, userText);
                if (parsed) return { ...parsed, source: '☁️ CLOUD AI' };
            }
        }
    } catch (e) {}
    return null;
}

async function tryCloudGetLayer(userText) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8500);
        const systemBrief = 'Ты милый и остроумный настольный ИИ-робот EMO. Ответь коротко (1-2 предложения) на русском языке по сути вопроса: ';
        const url = `https://text.pollinations.ai/${encodeURIComponent(systemBrief + userText)}?model=openai&seed=${Math.floor(Math.random() * 99999)}`;

        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
            const raw = await res.text();
            const parsed = parseFlexibleAiOutput(raw, userText);
            if (parsed) return { ...parsed, source: '☁️ CLOUD AI' };
        }
    } catch (e) {}
    return null;
}

let lastFallbackIndex = -1;
function generateSmartLocalResponse(rawText) {
    const text = rawText.trim();
    const t = text.toLowerCase();
    const requestedColor = detectRequestedColor(t);
    const requestedHolo = detectRequestedHologram(t);

    if (requestedHolo === 'coin') {
        return { reply: 'Подбрасываю виртуальную монетку прямо на своём экране! Смотри на результат! 🪙✨', emotion: 'curious', eyeColor: requestedColor, hologram: 'coin', source: '🧠 LOCAL AI' };
    }
    if (requestedHolo === 'dice') {
        return { reply: 'Бросаю игровой кубик D6 на своей OLED-матрице! Вот что выпало! 🎲⚡', emotion: 'happy', eyeColor: requestedColor, hologram: 'dice', source: '🧠 LOCAL AI' };
    }
    if (requestedHolo === 'rps') {
        return { reply: 'Камень, ножницы, бумага — раз, два, три! Смотри мой ход на экране! ✊✌️✋', emotion: 'happy', eyeColor: requestedColor, hologram: 'rps', source: '🧠 LOCAL AI' };
    }
    if (requestedHolo === 'time') {
        const nowStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return { reply: `Вывожу цифровые часы на экран! Сейчас ровно ${nowStr}. ⌚✨`, emotion: 'curious', eyeColor: requestedColor, hologram: 'time', source: '🧠 LOCAL AI' };
    }

    const directEmotion = detectEmotionFromText(t);
    if (directEmotion !== 'curious' && /(покажи|сделай|включи|изобрази|стань|режим|помой|протри|поспи|усни|чихни|поохоться)/i.test(t)) {
        const stObj = EMO_STATES.find(s => s.id === directEmotion);
        return { reply: stObj ? stObj.msg : 'С удовольствием выполняю твою просьбу! Смотри на моё лицо! 🤖✨', emotion: directEmotion, eyeColor: requestedColor, hologram: 'none', source: '🧠 LOCAL AI' };
    }

    const mathMatch = t.replace(/,/g, '.').match(/(-?\d+(?:\.\d+)?)\s*([\+\-\*\/xх×÷\^])\s*(-?\d+(?:\.\d+)?)/);
    if (mathMatch) {
        const a = parseFloat(mathMatch[1]);
        const op = mathMatch[2];
        const b = parseFloat(mathMatch[3]);
        let res = null;
        if (op === '+') res = a + b;
        else if (op === '-') res = a - b;
        else if (['*', 'x', 'х', '×'].includes(op)) res = a * b;
        else if (['/', '÷'].includes(op)) res = b !== 0 ? +(a / b).toFixed(4) : 'бесконечность';
        else if (op === '^') res = Math.pow(a, b);
        if (res !== null) {
            return { reply: `Мои математические сопроцессоры посчитали за 0.001 секунды: ${a} ${op} ${b} = ${res}! 🧮⚡`, emotion: 'happy', eyeColor: requestedColor, source: '🧠 LOCAL AI' };
        }
    }

    if (/(привет|здравствуй|хай|хелло|доброе утро|добрый день|добрый вечер|салам|йоу)/i.test(t)) {
        return { reply: 'Привет-привет! Мои OLED-глаза сияют на полную яркость! Как проходит твой день? 😄✨', emotion: 'happy', eyeColor: requestedColor, source: '🧠 LOCAL AI' };
    }
    if (/(кто ты|что ты такое|расскажи о себе|что ты умеешь|как тебя зовут)/i.test(t)) {
        return { reply: 'Я EMO — твой персональный настольный ИИ-робот! У меня 22 живые эмоции, пружинная физика взгляда и синтезатор голоса! 🤖⚡', emotion: 'curious', eyeColor: requestedColor, source: '🧠 LOCAL AI' };
    }
    if (/(злой смех|демон|рога|захват|коварн|злодей|муаха)/i.test(t)) {
        return { reply: 'МУА-ХА-ХА! Режим Кибер-Демона активирован на полную мощность! Узри мои неоновые рога! 😈🔥', emotion: 'demon', eyeColor: requestedColor || '#FF2A54', source: '🧠 LOCAL AI' };
    }
    if (/(шутк|анекдот|рассмеши|смешн|прикол|юмор)/i.test(t)) {
        return { reply: 'Почему программисты так любят тёмную тему? Потому что свет притягивает баги! 😄⚡', emotion: 'happy', eyeColor: requestedColor, source: '🧠 LOCAL AI' };
    }
    if (requestedColor) {
        return { reply: 'Готово! Я переключил подсветку своей OLED-матрицы на новый цвет! 🎨✨', emotion: 'happy', eyeColor: requestedColor, source: '🧠 LOCAL AI' };
    }

    const dynamicConversationalPool = [
        { reply: `Ого, «${text}» — отличная тема! Тут главное — творческий подход и капелька любопытства! 🧐✨`, emotion: 'curious' },
        { reply: `По поводу «${text}» скажу как робот: звучит как начало крутого приключения! 😄🚀`, emotion: 'happy' },
        { reply: `Хммм... Мои датчики подсказывают, что в словах «${text}» скрыт глубокий смысл! 👀💭`, emotion: 'suspicious' },
        { reply: `Вау, вот это поворот мысли! От «${text}» у меня даже частота процессора подпрыгнула! 😱⚡`, emotion: 'shock' }
    ];
    let idx = Math.floor(Math.random() * dynamicConversationalPool.length);
    if (idx === lastFallbackIndex) idx = (idx + 1) % dynamicConversationalPool.length;
    lastFallbackIndex = idx;
    const chosen = dynamicConversationalPool[idx];
    return { reply: chosen.reply, emotion: chosen.emotion, eyeColor: '', source: '🧠 LOCAL AI' };
}

async function askEmoAI(userMessage) {
    const text = (userMessage || '').trim();
    if (!text || isThinkingAI) return;

    sound.init();
    isThinkingAI = true;
    sound.startThinkingLoop();

    const aiBadge = document.getElementById('ai-status-badge');
    const sendBtn = document.getElementById('btn-send');
    if (aiBadge) {
        aiBadge.innerHTML = '🌀 EMO думает...';
        aiBadge.className = 'text-[11px] font-mono text-amber-300 flex items-center gap-1 animate-pulse';
    }
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.6';
    }

    showSpeechBubble('Хммм... Дай-ка подумать... 🧠⚡', 15000);

    const cfg = getSavedApiConfig();
    let finalDecision = null;

    try {
        if (!finalDecision && cfg.provider === 'openai' && cfg.customKey) {
            finalDecision = await tryCustomOpenAILayer(text, cfg);
        }
        if (!finalDecision && cfg.provider !== 'openai') {
            finalDecision = await tryGeminiLayer(text, cfg);
        }
        if (!finalDecision && cfg.customKey) {
            finalDecision = await tryCustomOpenAILayer(text, cfg);
        }
        if (!finalDecision) {
            finalDecision = await tryCloudPostLayer(text);
        }
        if (!finalDecision) {
            finalDecision = await tryCloudGetLayer(text);
        }
        if (!finalDecision) {
            finalDecision = generateSmartLocalResponse(text);
        }

        isThinkingAI = false;
        sound.stopLoops();

        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: JSON.stringify(finalDecision) });

        if (finalDecision.eyeColor && /^#[0-9A-Fa-f]{6}$/.test(finalDecision.eyeColor.trim())) {
            setEmoColor(finalDecision.eyeColor.trim());
        }

        const chosenEmotion = VALID_EMOTION_IDS.includes(finalDecision.emotion) ? finalDecision.emotion : 'happy';
        setEmotion(chosenEmotion, finalDecision.reply, true);

        const holoToRun = finalDecision.hologram || detectRequestedHologram(text);
        if (holoToRun && holoToRun !== 'none') {
            triggerFaceHologram(holoToRun);
        }

        if (aiBadge) {
            aiBadge.innerHTML = finalDecision.source || '✨ AI READY';
            aiBadge.className = 'text-[11px] font-mono text-emerald-300 flex items-center gap-1';
        }
    } catch (error) {
        isThinkingAI = false;
        sound.stopLoops();
        const localRes = generateSmartLocalResponse(text);
        if (localRes.eyeColor) setEmoColor(localRes.eyeColor);
        setEmotion(localRes.emotion, localRes.reply, true);
        if (aiBadge) {
            aiBadge.innerHTML = '🧠 LOCAL AI';
            aiBadge.className = 'text-[11px] font-mono text-cyan-300 flex items-center gap-1';
        }
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
    }
}
