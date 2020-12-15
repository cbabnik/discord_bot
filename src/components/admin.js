const { Component } = require( './component' );
const { CONFIG, PERMISSION_LEVELS, ACTIONS, BUCKS } = require( '../core/constants' );
const util = require( '../core/util' );
const debug = require( 'debug' )( 'basic' );
const Storage = require( '../core/pdata' );

const ID = 'admin';

class Admin extends Component {
    constructor() {
        super( ID );

        this.datastores = {}

        this.addCommand( /^#say (.*)$/, this.betaSay );
        this.addCommand( /^#ready\?$/, this.readyCheck );
        this.addCommand( /^#shutdown$/, this.shutdown );
        this.addCommand( /^#diagnostics$/, this.diagnostics );
        this.addCommand( /^#error$/, this.errorMe );
        this.addCommand( /^#status$/, this.status );
        this.addCommand( /^#set status (.*)$/, this.setStatus )
        this.addCommand( /^#set activity (.*)$/, this.setActivity )
        this.addCommand( /^#set avatar (.*)$/, this.setAvatar )
        this.addCommand( /^#set username (.*)$/, this.setUsername ) // once an hour
        this.addCommand( /^#set nickname (.*)$/, this.setNickName )
        this.addCommand( /^#delete message (\d+)$/, this.deleteMessage )
        this.addCommand( /^#delete message +(\d+) +(\d+)$/, this.deleteMessageOnChannel )
        this.addCommand( /^#react +(\d+) (.*)$/, this.react )
        this.addCommand( /^#deleteme$/, this.deleteMe )
        this.addCommand( /^#reactme$/, this.reactMe )
        this.addCommand( /^#sayto +(\S+) +(.*)$/, this.betaSayTo )
        this.addCommand( /^#sayin +(\d+) +(.*)$/, this.betaSayIn )
        this.addCommand( /^#drop +(\d+)$/, this.voiceDisconnect )
        this.addCommand( /^#move +(\d+) +(\d+)$/, this.voiceMove )
        this.addCommand( /^#kick +(\d+)$/, this.kick )
        this.addCommand( /^#security list +(\S+)$/, this.securityList )
        this.addCommand( /^#invite +(\d+)$/, this.serverInvite )
        this.addCommand( /^#mute +(\d+)$/, this.mute )
        this.addCommand( /^#unmute +(\d+)$/, this.unmute )
        this.addCommand( /^#displaykeys +([^ ]+)$/, this.displayKeys )
        this.addCommand( /^#display +([^ ]+) +([^ ]+)$/, this.displayData )
        this.addCommand( /^#setval +([^ ]+) +([^ ]+) +"(.+)"$/, this.setDataString )
        this.addCommand( /^#setval +([^ ]+) +([^ ]+) +(\d+)$/, this.setDataValue )
        this.addCommand( /^#admin$/, this.listAdmins )
    }

    listAdmins() {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        this.setAction( 'message' , "Admin commands include: setval,display,displaykeys,invite,say,ready?,diagnostics,error,status,set avatar,set nickname,react,sayin,...")
    }


    setNickName( nickname, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if (!PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        util.getGuild().members.fetch(BUCKS.BUCKBOT).then(member => {
            member.setNickname(nickname)
        }).catch((e) => {
            debug(`Failed to nickname: ${e}`)
        })
    }

    async displayKeys( storeId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if (!PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        let store;
        if ( Object.keys(this.datastores).includes(storeId) ) {
            store = this.datastores[storeId]
        } else {
            store = await Storage( storeId );
        }
        const keys = await store.storage.keys()
        this.setAction( 'message', keys)
    }

    async displayData( storeId, field, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if (!PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        let store;
        if ( Object.keys(this.datastores).includes(storeId) ) {
            store = this.datastores[storeId]
        } else {
            store = await Storage( storeId );
        }
        const data = await store.get( field, "empty" )
        this.setAction( 'message', JSON.stringify(data, null, 3))
    }

    async setDataValue( storeId, field, val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        let store;
        if ( Object.keys(this.datastores).includes(storeId) ) {
            store = this.datastores[storeId]
        } else {
            store = await Storage( storeId );
        }
        store.set(field, Number(val))
        this.setAction( 'reaction', '🛫')
    }

    async setDataString( storeId, field, str, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        let store;
        if ( Object.keys(this.datastores).includes(storeId) ) {
            store = this.datastores[storeId]
        } else {
            store = await Storage( storeId );
        }
        store.set(field, str)
        this.setAction( 'reaction', '🛫');
    }

    mute( memberId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            util.getGuild().members.fetch(memberId).then(member => {
                member.voice.setMute(true)
            }).catch((e) => {
                debug(`Failed to mute: ${e}`)
            })
        }
    }

    unmute( memberId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            util.getGuild().members.fetch(memberId).then(member => {
                member.voice.setMute(false)
            }).catch((e) => {
                debug(`Failed to unmute: ${e}`)
            })
        }
    }

    serverInvite( userId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            util.getGuild().addMember(userId)
        }
    }

    securityList( type, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            if (type in PERMISSION_LEVELS) {
                this.setAction( 'message', PERMISSION_LEVELS[type].join(','))
            } else {
                this.setAction( 'message', "only ADMIN,SUPERUSER,MOD are allowed")
            }
        }
    }

    kick( memberId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            util.getGuild().members.fetch(memberId).then(member => {
                member.kick()
            }).catch((e) => {
                debug(`Failed to kick: ${e}`)
            })
        }
    }

    voiceMove( memberId, channelId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            util.getGuild().members.fetch(memberId).then(member => {
                member.voice.setChannel(channelId)
            }).catch((e) => {
                debug(`Failed to voice move: ${e}`)
            })
        }
    }

    voiceDisconnect( memberId, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            util.getGuild().members.fetch(memberId).then(member => {
                member.voice.kick()
            }).catch((e) => {
                debug(`Failed to voice disconnect: ${e}`)
            })
        }
    }

    async react( id, emoji, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            const client = util.getClient()
            client.channels.cache.get(metaInfo.channelId).messages.fetch(id).then(msg => {
                msg.react(emoji)
                metaInfo.message.react('🛫')
            }).catch(() => {
                metaInfo.message.react('❌')
            })
        }
    }

    async deleteMessage( id, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            const client = util.getClient()
            client.channels.cache.get(metaInfo.channelId).messages.fetch(id).then(msg => {
                if ( msg.constructor == metaInfo.message.constructor) {
                    msg.delete()
                    metaInfo.message.react('🗑️')
                }
            }).catch(() => {
                metaInfo.message.react('❌')
            })
        }
    }

    async deleteMessageOnChannel( channelId, id, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            const client = util.getClient()
            const result = client.channels.cache.get(channelId).messages.fetch(id).then(msg => {
                if ( msg.constructor == metaInfo.message.constructor) {
                    msg.delete()
                    metaInfo.message.react('🗑️')
                }
            }).catch(() => {
                metaInfo.message.react('❌')
            })
        }
    }

    reactMe( metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            metaInfo.message.react("🛂")
        }
    }

    deleteMe( metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            metaInfo.message.delete()
        }
    }

    setStatus( val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            const cli = util.getClient()
            if ( val !== "online" && val !== "idle" && val !== "invisible") {
                this.setAction( 'message', "Only values \"idle\", \"invisible\", \"online\" are acceptible." )
            } else if (cli.user.presence.status == val) {
                this.setAction( 'message', `Status is already ${val}` )
            } else {
                cli.user.setStatus(val)
            }
        }
    }

    setActivity( val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            const cli = util.getClient()
            cli.user.setActivity(val)
        }
    }

    setUsername( val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            const cli = util.getClient()
            cli.user.setUsername(val)
        }
    }

    setAvatar( val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            const cli = util.getClient()
            cli.user.setAvatar(val)
        }
    }

    status( ) {
        this.setAction( 'security', PERMISSION_LEVELS.MOD );
        const cli = util.getClient()
        const a = cli.user.presence.activity
        let msg = `
readySince \`${cli.readyAt}\`
uptime \`${cli.uptime}\`
status \`${cli.user.presence.status}\`
avatar \`${cli.user.displayAvatarURL()}\`
activity \`${a?`${a.name} (${a.type}) url${a.url}`:"None"}\`
`
        this.setAction( 'message', msg )
    }

    errorMe( metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'message', "Doing a wonka wonka" );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            wonkawonka
        }
    }

    betaSay( msg ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
        this.setAction( 'message', msg );
    }

    betaSayTo( userId, msg ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( ACTIONS.MESSAGE_USER_ID, userId );
        this.setAction( 'message', msg );
    }

    betaSayIn( channelId, msg ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channelId', channelId );
        this.setAction( 'message', msg );
    }

    readyCheck() {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'message', "ready" );
    }

    shutdown( metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            process.exit( 0 );
        }
    }

    diagnostics() {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        this.setAction( 'message', "Testing message sending")
        this.queueAction()
        this.setAction( 'message', "Testing chained commands")
        this.setAction( 'delay', 1)
        this.queueAction()
        this.setAction( 'message', "Testing audio")
        this.setAction( 'audioFile', "AAAAAAAA.mp3")
        this.setAction( 'delay', 1)
        this.queueAction()
        this.setAction( 'message', "Testing youtube")
        this.setAction( 'audioYoutube', "https://www.youtube.com/watch?v=3YXUWWZJXpE")
        this.setAction( 'delay', 3)
        this.queueAction()
        this.setAction( 'message', "Testing youtube live")
        this.setAction( 'audioYoutubeLive', "https://www.youtube.com/watch?v=5qap5aO4i9A")
        this.setAction( 'delay', 4)
        this.queueAction()
        this.setAction( 'message', "Testing audio link")
        this.setAction( 'audioLink', "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
        this.setAction( 'delay', 4)
        this.queueAction()
        this.setAction( 'delay', 3)
        this.setAction( 'message', "Ending audio, testing pictures")
        this.setAction( 'endAudio', true)
        this.setAction( 'imageLink', [
            "https://media.discordapp.net/attachments/265430059010097162/752356103274365058/petthekewe.gif",
            "https://cdn.discordapp.com/attachments/297264375276896256/387406708299005952/unknown.png"
        ])
    }
}

module.exports = { admin: new Admin() };
