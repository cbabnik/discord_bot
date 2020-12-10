/* eslint-disable no-console */

// client.js
// This class is a thin wrapper around Discord's client. Any behavior to the client itself, regardless of the commands
// that use it should be here. This means to reconnect the client when it disconnects, to accept or ignore invites, etc

const Discord = require( 'discord.js' );
const { CLIENT_CONNECTED, CONFIG } = require( './constants' );

const Client = ( max_messages, login_token ) => {
    const cli = new Discord.Client( {
        messageCacheMaxSize: max_messages,
        presence: {
            status: CONFIG.INVISIBLE ? 'invisible' : 'online',
        },
    } );

    let state = "disconnected"
    // try to login every 30 seconds if disconnected
    cli.login( login_token ).then( () => {
        state = "connected"
        cli.setInterval(
            function tryLogin() {
                if ( state === "disconnected" ) {
                    console.log(`Not logged in. (status: ${cli.user.presence.status}), logging in.`)
                    cli.login( login_token ).then(() => {
                        state = "connected"
                    }).catch( console.error );
                }
            },
            30000
        );
    } ).catch( console.error );        


    cli.on("disconnected", () => {
        state = "disconnected"
    });

    cli.strikes = {};
    // after ~8 seconds of inactivity disconnect from voice channels
    cli.setInterval( () => {
        try {
            cli.voice.connections.array().forEach( ( c ) => {
                const vc = c.channel;
                const n = vc.id

                cli.strikes[n] = cli.strikes[n]+1 || 1;
                if ( cli.strikes[n] > 2 ) {
                    vc.leave();
                    cli.strikes[n] = 0;
                }
            } );
        } catch ( e ) {
            console.error( 'Client recovered from an error' );
            console.error( e )
        }
    }, 3000 );
    
    // when client encounters an error (like a timeout) log it without exiting node
    cli.on('error', (e) => {
        console.error( "Client error" )
        console.error( e )
    });

    return cli;
};


module.exports = {Client};
