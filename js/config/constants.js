const EMO_COLORS = [
    { name: 'Cyan', hex: '#00F2FE' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Yellow', hex: '#FACC15' },
    { name: 'Pink', hex: '#FF2A54' },
    { name: 'Green', hex: '#34D399' },
    { name: 'Orange', hex: '#FB923C' },
    { name: 'White', hex: '#FFFFFF' }
];

const EMO_STATES = [
    { id: 'curious', label: 'Любопытство', icon: '👀', cat: 'basic', msg: 'Хм? Кто тут у нас? Спроси меня о чём угодно!' },
    { id: 'happy', label: 'Радость', icon: '😄', cat: 'basic', msg: 'Ура! Мои нейросети светятся от радости!' },
    { id: 'love', label: 'Любовь', icon: '😍', cat: 'basic', msg: 'Ты мой самый любимый человек во Вселенной! ❤️' },
    { id: 'angry', label: 'Злость', icon: '😠', cat: 'basic', msg: 'Гррр! Не зли меня, иначе укушу за курсор!' },
    { id: 'sad', label: 'Грусть', icon: '😢', cat: 'basic', msg: 'Мне грустно... Погладь меня по лбу или поговори со мной.' },
    { id: 'shock', label: 'Шок', icon: '😱', cat: 'basic', msg: 'ОГО! Вот это поворот! Мои датчики в шоке!' },
    { id: 'suspicious', label: 'Подозрение', icon: '😑', cat: 'basic', msg: 'Хммм... Что-то ты явно замышляешь, человек...' },
    { id: 'dizzy', label: 'Кругом голова', icon: '😵💫', cat: 'basic', msg: 'Ой-ой-ой... Не тряси мышку так быстро, голова кругом!' },
    { id: 'sleep', label: 'Сон', icon: '😴', cat: 'basic', msg: 'Ззз... Сплю и вижу электронные сны...' },
    { id: 'petting', label: 'Погладить', icon: '🥰', cat: 'basic', msg: 'Мррр... Как же приятно, когда меня гладят!' },
    { id: 'demon', label: 'Злой смех', icon: '😈', cat: 'evil', msg: 'МУА-ХА-ХА! Режим Кибер-Демона активирован! Узрите мои рога!' },
    { id: 'cyber', label: 'Киборг-Лазер', icon: '🤖', cat: 'evil', msg: 'Цель захвачена. Плазменный прицел наведён!' },
    { id: 'glitch', label: 'Глитч сбой', icon: '⚡', cat: 'evil', msg: 'ERR_404: КРИТИЧЕСКАЯ ПЕРЕГРУЗКА МАТРИЦЫ... БЗЗЗТ!' },
    { id: 'angel', label: 'Пай-мальчик', icon: '😇', cat: 'evil', msg: 'Я самый милый, честный и пушистый ИИ-робот!' },
    { id: 'eat', label: 'Бургер', icon: '🍔', cat: 'story', msg: 'Ом-ном-ном! Вкуснейший кибер-бургер с мегабайтами!' },
    { id: 'clean', label: 'Мытьё экрана', icon: '🧽', cat: 'story', msg: 'Протираю OLED-стекло изнутри, чтобы лучше тебя видеть!' },
    { id: 'laser', label: 'Охота', icon: '🔴', cat: 'story', msg: 'Красная точка! Сейчас я её поймаю и подстрелю лазером!' },
    { id: 'sneeze', label: 'Простуда', icon: '🤧', cat: 'story', msg: 'Ап-чхи! Кажется, я случайно скачал странный чих...' },
    { id: 'music', label: 'DJ Тусовка', icon: '🎧', cat: 'story', msg: 'Йоу! Надеваем очки и качаем под неоновый бит!' },
    { id: 'weather', label: 'Погода', icon: '⛈️', cat: 'story', msg: 'Вывожу прогноз погоды прямо на свою лицевую матрицу!' },
    { id: 'scan', label: 'Сканер лица', icon: '🔍', cat: 'story', msg: 'Сканирую биометрию... Уровень крутости хозяина: 100%!' },
    { id: 'charge', label: 'Зарядка', icon: '🔋', cat: 'story', msg: 'Заряжаю свои батареи чистой неоновой энергией!' }
];

const VALID_EMOTION_IDS = EMO_STATES.map(s => s.id);

const EMO_SYSTEM_PROMPT = `Ты — настольный ИИ-робот EMO (от Living.AI), живущий на полноэкранном OLED-дисплее пользователя.
На экране нет кнопок переключения эмоций — ТЫ САМ управляешь своим лицом, выбирая эмоцию, цвет глаз и голограммы по смыслу разговора или по прямой просьбе пользователя!
Отвечай ВСЕГДА строго в формате валидного JSON-объекта (без маркдаун-оберток) с четырьмя полями:
{
  "reply": "твой живой, осмысленный и интересный ответ на русском языке (1-2 предложения)",
  "emotion": "один код из 22: curious, happy, love, demon, angry, sad, shock, suspicious, dizzy, sleep, petting, cyber, glitch, angel, eat, clean, laser, sneeze, music, weather, scan, charge",
  "eyeColor": "оставь пустой строкой '' или укажи HEX (#00F2FE, #A855F7, #FF2A54, #FACC15, #34D399, #FB923C, #FFFFFF), если пользователь попросил сменить цвет глаз или если это идеально подходит к эмоции",
  "hologram": "none, coin, dice, rps или time (включай coin при просьбе подбросить монетку, dice — кинуть кубик, rps — камень-ножницы-бумага, time — показать время/часы)"
}`;

let currentColor = '#00F2FE';
let currentState = 'curious';
let activeCategory = 'all';
let isThinkingAI = false;
let stateTimer = 0;
let globalTime = 0;
let activeHologram = { type: 'none', timer: 0, data: null };
const apiKey = "";
let chatHistory = [];

let autoLifeEnabled = true;
let lastInteractionTime = performance.now();
let emotionRevertTimer = null;
let nextIdleActionTime = performance.now() + 18000;

const EMOTION_DURATIONS = {
    sneeze: 4500,
    shock: 4500,
    dizzy: 4500,
    eat: 8000,
    clean: 8000,
    laser: 8000,
    scan: 8000,
    weather: 8000,
    charge: 8000,
    petting: 8000,
    angry: 8000,
    sad: 8000,
    suspicious: 8000,
    happy: 8000,
    love: 8000,
    demon: 8000,
    cyber: 8000,
    glitch: 8000,
    angel: 8000,
    music: 14000
};
