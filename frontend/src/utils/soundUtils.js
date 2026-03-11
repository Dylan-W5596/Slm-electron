import { SOUNDS } from '../assets/assets';

// 預定義音效路徑
const SOUND_PATHS = {
    click: SOUNDS.mouseClick,
    click_Mouse: SOUNDS.buttonClick,
    success: SOUNDS.success,
    error: SOUNDS.blip,
};

// 快取 Audio 物件
const audioCache = {};

export const playSound = (type, enabled = true) => {
    if (!enabled || !SOUND_PATHS[type]) return;

    try {
        if (!audioCache[type]) {
            audioCache[type] = new Audio(SOUND_PATHS[type]);
        }

        const sound = audioCache[type];
        sound.currentTime = 0; // 重置播放進度
        sound.play().catch(e => console.warn('音訊播放被瀏覽器阻擋或找不到檔案:', e));
    } catch (e) {
        console.error('音訊播放錯誤:', e);
    }
};
