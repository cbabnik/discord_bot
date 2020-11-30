exports.MAX_MESSAGES = 500;
exports.BOT_PERMISSIONS = 1329069136;  // find this via the developer portal -> bot -> permissions calculator

exports.CLIENT_CONNECTED = 0;
exports.DMCHANNEL = 'dm';

const CONFIG = {
    LOG_DIRECTORY: './logs',
    STORAGE_DIRECTORY: './storage/',
    INVISIBLE: true,
};
const TEST = {
    STORAGE_DIRECTORY: 'storage/test/',
    VERSION: 'test',
};
const ALPHA = {
    STORAGE_DIRECTORY: 'storage/alpha/',
    MAIN_CHANNEL: '783065930950508544', // secret channel
    // MAIN_CHANNEL: '533736402085478410',
    MAIN_VOICE_CHANNEL: '783066002304270377', // secret voice channel
    // MAIN_VOICE_CHANNEL: '533736402085478412',
    GUILD: '533736401225908224',
    VERSION: 'alpha',
    NAME: 'BuckBotAlpha',
};
const BETA = {
    STORAGE_DIRECTORY: './storage/beta/',
    MAIN_CHANNEL: '265430059010097162',
    MAIN_VOICE_CHANNEL: '265430059500699648',
    GUILD: '265430059010097162',
    VERSION: 'beta',
    NAME: 'BuckBotBeta',
};
if ( process.argv.length > 2 ) {
    let defaults = {};
    if ( process.argv[2] === '--alpha' ) {
        defaults = ALPHA;
    } else if ( process.argv[2] === '--beta' ) {
        defaults = BETA;
    } else if ( process.argv[2] === '--test' ) {
        defaults = TEST;
    }
    Object.keys( defaults ).forEach( k => {
        CONFIG[k] = defaults[k];
    } );
}
exports.CONFIG = CONFIG;
exports.BETA = BETA;
exports.ALPHA = ALPHA;

exports.ACTIONS = {
    // OPTIONS
    CHANNEL_ID: 'channelId',
    VOICE_CHANNEL: 'voiceChannel',
    MESSAGE: 'message',
    MESSAGE_ID: 'messageId',
    MESSAGE_USER_ID: 'messageUserId',
    EDIT_ID: 'editId',
    AS_USERNAME: 'asUsername',
    SECURITY: 'security',
    LOCATION: 'location',
    IMAGE: 'image',
    IMAGE_LINK: 'imageLink',
    AUDIO_FILE: 'audioFile',
    AUDIO_YOUTUBE: 'audioYoutube',
    AUDIO_LINK: 'audioLink',
    END_AUDIO: 'endAudio',
    REPEAT: 'repeat',
    DELAY: 'delay',
    TIMING: 'timing',
    NEXT: 'next',
    // SENTINEL VALUES WITH SPECIAL MEANING
    USE_SOURCE: 'use_source',
    DMCHANNEL: 'dm',
    YES: 'yes',
};

const BUCKS = {
    BUGSLINGER: '106853033526247424',
    KAWAIICASINO: '195244363339530240',
    SHITKITTEN: '108723275437260800',
    GINGE: '227593217963589632',
    COLTSU: '265408414476271616',
    ALLEEN: '267214649085132800',
    BRODIZLE: '482330027732762644',
    DEVAN: '295437941235253249',
    KENRICASUEBERRY: '265734010729136129',
    KNICKKNACKSPARROW: '218204627919831040',
    EGGS: '238418321786011648',
    LAMP: '300522076001796096',
    TOMMI: '244335529120759808',
    XXCOWFACE: '120350426779353088',
    LUNES: '177955985225154560',
    QEWE: '219158737376641026',
    BUCKBOT: '533749978955513856',
    RENNY: '238418321786011648',
    THEEVILSHOGUN: '106883299745546240',
};
exports.BUCKS = BUCKS;

exports.ALIASES = {
    BUGS: '106853033526247424',
    BUG: '106853033526247424',
    BRANDON: '106853033526247424',
    DION: '120350426779353088',
    KEWE: '219158737376641026',
    KENNY: '265734010729136129',
    COLTON: '265408414476271616',
    REMINGTON: '108723275437260800',
    REMROD: '108723275437260800',
    CURTIS: '177955985225154560',
    CMAN: '177955985225154560',
    'C-MAN': '177955985225154560',
    THECMAN: '177955985225154560',
    HELLGINGER: '227593217963589632',
    HELLGINGE: '227593217963589632',
    WHITERAVEN: '227593217963589632',
    THEWHITERAVEN: '227593217963589632',
    KEVIN: '227593217963589632',
    KEISS: '218204627919831040',
    CLACKABACK: '218204627919831040',
    KEITH: '218204627919831040',
    SHOGUN: '106883299745546240',
    EVILSHOGUN: '106883299745546240',
    SHOGY: '106883299745546240',
};

const PERMISSION_LEVELS = {};
PERMISSION_LEVELS.ADMIN = [BUCKS.LUNES, BUCKS.KENRICASUEBERRY];
PERMISSION_LEVELS.SUPERUSER = [...PERMISSION_LEVELS.ADMIN, BUCKS.COLTSU, BUCKS.BUGSLINGER];
PERMISSION_LEVELS.MOD = [...PERMISSION_LEVELS.SUPERUSER, BUCKS.GINGE, BUCKS.QEWE, BUCKS.KNICKKNACKSPARROW, BUCKS.TOMMI];
exports.PERMISSION_LEVELS = PERMISSION_LEVELS;

