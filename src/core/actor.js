// actor.js
// Actor simplifies things such as sending a message to a channel, but it also governs the WAY it is sent.
// Maybe you want to say happy birthday to someone at a specific date, just set instruction.timing, actor will take care
// of the sloppy details.
// More importantly this class gives more dynamic/fluid behavior. For example, Lunes could get nicknamed SirPoops for
// a day and every component would say SirPoops instead of Lunes if you declare that behavior here, All Audio can be
// muted or given a different volume for awhile. The instructions specify "what" but this class has a lot of say on the
// "how"

const { BUCKS, DMCHANNEL, ACTIONS } = require( './constants' );
const { getVoiceChannel } = require( './util' );
const debug = require( 'debug' )( 'actor' );
const debugExtra = require( 'debug' )( 'extra' );
const ytdl = require( 'ytdl-core' );
const fs = require( 'fs' );

const messagesForEdit = {};

const NAME = 'BuckBotAlpha';
let nickname = NAME;

const Actor = ( client ) => {

    const DEFAULT_INSTRUCTIONS = {
        // for a list of instruction choices, try constants.js
        channelId: ACTIONS.USE_SOURCE,
        voiceChannel: ACTIONS.USE_SOURCE,
        audioSeek: 0,
        endAudio: false,
        repeat: 1,
        delay: 0,
    };

    const handle = ( instructionPkg, msg ) => {
        logForDebug( instructionPkg );

        // set
        // ___
        const ins = { ...DEFAULT_INSTRUCTIONS, ...instructionPkg };
        if ( msg ) {
            const sourceVoice = getVoiceChannel( msg.author.id );
            if ( sourceVoice ) {
                ins.voiceChannel = sourceVoice;
            } else {
                ins.voiceChannel = undefined;
            }
        }

        let channel;
        if ( ins[ACTIONS.MESSAGE_USER_ID] ) {
            const user = client.users.resolve( ins[ACTIONS.MESSAGE_USER_ID] );
            user.createDM().then( ( dmchannel ) => {
                dmchannel.send( ins.message );
                handle( {...ins, message: undefined, messageUserId: undefined}, msg );
            } );
            return;
        } else if ( ins.channelId===ACTIONS.USE_SOURCE ) {
            channel = msg.channel;
            ins.channelId = channel.id;
        } else {
            channel = client.channels.resolve( ins.channelId );
        }
        if ( !channel ) {
            debug( 'There was a problem with setting channel' );
            return;
        }


        // permission gating
        // _________________
        if ( ins.security && !ins.security.includes( msg.author.id ) ) {
            channel.send( `**${msg.author.name}**, You don't have the required security clearance to do that!` );
            return;
        }
        if ( ins.location === 'public' && msg.channel.type === DMCHANNEL ) {
            channel.send( 'Please do this in a public channel.' );
            return;
        } else if ( ins.location && ins.location !== 'public' && ins.location !== channel.name ) {
            channel.send( `Please do this in the \`${ins.location}\` channel.` );
            return;
        }

        // timing
        // ______
        if ( ins.delay > 0 ) {
            setTimeout( () => {
                handle( {...ins, delay: 0}, msg );
            }, ins.delay*1000 );
            return;
        }
        if ( ins.timing ) {
            const currentMS = new Date().getTime();
            const desiredMS = ins.timing.getTime();
            handle( {...ins, delay: ( desiredMS-currentMS )/1000, timing: undefined}, msg );
            return;
        }

        // messages
        // ________
        if ( ins.message && ins.message.includes( 'user#' ) ) {
            Object.keys( BUCKS ).forEach( k => {
                const name = k.charAt( 0 ) + k.slice( 1 ).toLowerCase();
                ins.message = ins.message.replace( `user#${BUCKS[k]}`, name );
            } );
        }
        if ( ins.asUsername ) {
            msg.guild.members.resolve( client.user.id ).setNickname( ins.asUsername ).then( () => {
                nickname = ins.asUsername;
                setTimeout( () => {
                    channel.send( ins.message ).then( () => {
                        msg.guild.members.resolve( client.user.id ).setNickname( NAME ).then( () => {
                            nickname = NAME;
                            handle( {...ins, asUsername: undefined, message: undefined, messageId: undefined}, msg );
                        } );
                    } );
                } );
            } );
            return;
        }
        if ( nickname !== NAME ) {
            msg.guild.members.resolve( client.user.id ).setNickname( NAME ).then( () => {
                nickname = NAME;
                handle( ins, msg );
            } );
            return;
        }
        const embeds = {};
        if ( ins.image ) {
            let path = 'res/images/' + ins.image;
            if ( ins.image.includes( ':\\' ) ) {
                path = ins.image;
            } else if ( !ins.image.includes( '.' ) ) {
                path += '.jpg';
            }
            embeds.files = [{
                attachment: path,
                name: ins.image
            }];
        } else if ( ins.imageLink ) {
            embeds.files = Array.isArray( ins.imageLink ) ? ins.imageLink : [ins.imageLink];
        }
        const src = ins.editId ? messagesForEdit[ins.editId] : channel;
        const fn = ins.editId ? messagesForEdit[ins.editId].edit : channel.send;
        const params = ins.message ? [ins.message, embeds] : [embeds];
        if ( ins.message || Object.keys( embeds ).length > 0 ) {
            fn.call( src, ...params ).then( newMsg => {
                if ( ins.messageId ) {
                    messagesForEdit[ins.messageId] = newMsg;
                    handle( {...ins, message: undefined, messageId: undefined}, msg );
                }
            } ).catch( err => {
                debug( 'Message Error: ' + err.message );
            } );
            if ( ins.messageId ) {
                return; // give time for the new message to appear before doing edits and stuff
            }
        }

        // messages
        // ________

        if ( ins.reaction ) {
            msg.react(ins.reaction).then(() => {}).catch(() => {
                msg.react('❓')
            })
        }

        // audio
        // _____
        if ( ins.endAudio ) {
            client.voice.connections.array().forEach( ( c ) => {
                c.disconnect()
            } );
        }
        if ( ins[ACTIONS.VOICE_CHANNEL] && ( ins.audioFile || ins.audioYoutube || ins.audioLink || ins.audioYoutubeLive ) ) {
            try {
                const vc = client.channels.resolve( ins.voiceChannel );
                vc.join().then( connection => {
                    const broadcast = client.voice.createBroadcast();
                    if ( ins.audioFile ) {
                        if ( !ins.audioFile.includes( '.' ) ) {
                            ins.audioFile += '.mp3';
                        }
                        const path = 'res/audio/' + ins.audioFile;
                        if ( fs.existsSync( path ) ) {
                            broadcast.play( path, {bitrate: 192000} );
                        } else {
                            debug( `File ${ins.audioFile} not found` );
                        }
                    } else if ( ins.audioYoutube ) {
                        const stream = ytdl( ins.audioYoutube, { filter: 'audioonly' } );
                        broadcast.play( stream, {seek: ins.audioSeek, bitrate: 192000} );
                    } else if ( ins.audioYoutubeLive ) {
                        const stream = ytdl( ins.audioYoutubeLive );
                        broadcast.play( stream, {seek: ins.audioSeek, quality: '95'} );
                    } else if ( ins.audioLink ) {
                        broadcast.play( ins.audioLink, {bitrate: 192000} );
                    }
                    connection.play( broadcast );
                }, error => {
                    throw error
                } );
            } catch ( err ) {
                debug( 'Audio error: ' + err.message );
            }
        }

        // chaining instructions
        // _____________________
        if ( ins.repeat > 1 ) {
            if ( ins.repeat > 10 ) {
                ins.repeat = 10;
            }
            handle( {...ins, repeat: ins.repeat-1}, msg );
            return;
        }
        if ( ins.next ) {
            handle( {channel:instructionPkg.channel, ...ins.next}, msg );
        }
    };

    const logForDebug = ( instructionPkg ) => {
        let msgShortened = '';
        if ( instructionPkg.message ) {
            if ( instructionPkg.message.length > 40 ) {
                msgShortened = instructionPkg.message.slice( 0,37 ) + '...';
            } else {
                msgShortened = instructionPkg.message;
            }
        }

        let audioInfo = '';
        if ( instructionPkg.audioFile ) {
            audioInfo = '<' + instructionPkg.audioFile + '>';
        }

        let delayInfo = '';
        if ( instructionPkg.delay !== 0 && instructionPkg.delay !== undefined ) {
            delayInfo = ' [delay '+instructionPkg.delay+'s]';
        } else if ( instructionPkg.timing ) {
            delayInfo = ' [timing '+instructionPkg.timing+']';
        }

        let repeatInfo = '';
        if ( instructionPkg.repeat > 1 ) {
            repeatInfo = ' [repeat '+instructionPkg.repeat+'x]';
        } else if ( instructionPkg.next ) {
            repeatInfo = ' [hasNext]';
        }

        debug( '%s%s%s%s', msgShortened, audioInfo, delayInfo, repeatInfo );
        debugExtra( instructionPkg );
    };

    return {
        handle
    };
};

module.exports = { Actor };
