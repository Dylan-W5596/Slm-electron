// Icons
import createFolderIcon from './icons/I351001_create_new_folder.png';
import folderDeleteIcon from './icons/I351002_folder_delete_24dp.png';
import folderIcon from './icons/I351003_folder.png';
import folderCopyIcon from './icons/I351004_folder_copy_24dp.png';
import sendIcon from './icons/I351005_send.png';
import settingsIcon from './icons/I351006_settings.png';
import stopIcon from './icons/I351007_stop.png';
import homeIcon from './icons/I351008_home.png';
import progressIcon from './icons/I351009_progress_activity.png';
import starIcon from './icons/I351010_galaxy_star.png';
import globalIcon from './icons/I351011_global.png';
import chatIcon from './icons/I351012_chat_smile.png';
import agentIcon from './icons/I351013_customer_service.png';
import renameIcon from './icons/I351014_drawer_alt.png';
import deleteIcon from './icons/I351015_trash_xmark.png';
import updateIcon from './icons/I351016_update.png';
import coffeeIcon from './icons/I351017_mug_hot.png';
import investIcon from './icons/I351018_invest.png';
import chartIcon from './icons/I351019_chart_pie.png';
import omniSysIcon from './icons/I351020_objects_column.png'
import accountIcon from './icons/IM742001_account_circle.png';
import copyAllIcon from './icons/IM742002_copy_all.png';
import replyIcon from './icons/IM742003_reply.png';


// Sounds
import clickBubbleSound from './sounds/C1001_button_click_bubble.wav';
import mouseClickSound from './sounds/C9001_Mouse_Click.wav';
import buttonClickSound from './sounds/C9002_button_click.wav';
import powerupSuccessSound from './sounds/N37001_powerupsuccess.wav';
import notificationSound from './sounds/N55001_notification_sound.wav';
import rushBlipSound from './sounds/N89001_rush__blip9.wav';

export const ICONS = {
    //I351
    createFolder: createFolderIcon,
    folderDelete: folderDeleteIcon,
    folder: folderIcon,
    folderCopy: folderCopyIcon,
    send: sendIcon,
    settings: settingsIcon,
    stop: stopIcon,
    home: homeIcon,
    progress: progressIcon,
    star: starIcon,
    global: globalIcon,
    chat: chatIcon,
    agent: agentIcon,
    account: accountIcon,
    rename: renameIcon,
    delete: deleteIcon,
    update: updateIcon,
    coffee: coffeeIcon,
    invest: investIcon,
    chartPie: chartIcon,
    omniSys: omniSysIcon,
    // IM742
    copyAll: copyAllIcon,
    reply: replyIcon,
};

export const SOUNDS = {
    clickBubble: clickBubbleSound,
    mouseClick: mouseClickSound,
    buttonClick: buttonClickSound,
    success: powerupSuccessSound,
    notification: notificationSound,
    blip: rushBlipSound
};

const assets = { ICONS, SOUNDS };
export default assets;
