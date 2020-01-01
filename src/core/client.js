/* eslint-disable no-console */

// client.js
// This class is a thin wrapper around Discord's client. Any behavior to the client itself, regardless of the commands
// that use it should be here. This means to reconnect the client when it disconnects, to accept or ignore invites, etc

const Discord = require( 'discord.js' );
const { CLIENT_CONNECTED } = require( './constants' );

const Client = ( max_messages, login_token ) => {
    const cli = new Discord.Client( {
        messageCacheMaxSize: max_messages
    } );

    // try to login every 30 seconds if disconnected
    cli.login( login_token ).then( () => cli.setInterval(
        function tryLogin() {
            if ( cli.status !== CLIENT_CONNECTED ) {
                cli.login( login_token ).catch( console.error );
            }
        },
        30000
    ) );

    const bytes_sent = {};
    const strikes = {};
    // after ~8 seconds of inactivity disconnect from voice channels
    cli.setInterval( () => {
        try {
            cli.voiceConnections.array().forEach( ( c ) => {
                const vc = c.channel;
                const n = vc.name;

                const streamCount = c.player.streamingData.count;
                if ( streamCount === bytes_sent[n] ) {
                    strikes[n] = strikes[n]+1 || 1;
                    if ( strikes[n] > 2 ) {
                        vc.leave();
                        strikes[n] = 0;
                    }
                } else {
                    strikes[n] = 0;
                }
                bytes_sent[n] = streamCount;
            } );
        } catch ( e ) {
            console.error( 'Client recovered from an error' );
        }
    }, 3000 );
    return cli;
};

module.exports = {Client};
