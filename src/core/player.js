// pause
// resume

// check repeat orders on stream end (-1, 0, #)

// tracks the current dispatcher

class Player {
    constructor(client) {
        this.client = client
        this.dispatcher = undefined;

        this.paused = false;
        this.currentTimeout = undefined;
        this.saved_instructions = undefined;
        this.lastSpoke = undefined;

        this.repeat_instruction = 0;

        this.strikes = {};
        this.setUpSpeechListener();
    }

    play(vc, res, opts, repeats=0) {
        this.paused = false;
        this.lastSpoke = Date.now();
        this.strikes = {};
        vc.join().then((connection) => {
            const broadcast = this.client.voice.createBroadcast();
            broadcast.play(res, opts)
            const dispatcher = connection.play( broadcast );
            dispatcher.on("speaking", is_speaking => {
                this.strikes = {};
                this.lastSpoke = Date.now();
            })
            this.dispatcher = dispatcher;
    
            this.repeat_instruction = repeats;
    
            if (this.currentTimeout) {
                clearInterval(this.currentTimeout)
                this.currentTimeout = undefined;
            }
            const timeout = setInterval(() => {
                this.heartbeat();
            },100);
            this.currentTimeout = timeout;
    
            this.saved_instructions = {
                vc,
                res,
                opts,
            }
        }).catch(err => {
            throw err;
        })
    }

    togglePause() {
        if (!this.paused) {
            this.pause()
        } else {
            this.resume();
        }
    }

    pause() {
        this.paused = true;
        try {
            this.dispatcher.pause(true);
        } catch {
            // catches error when dispatcher has nothing to pause
        }
    }

    resume() {
        this.paused = false;
        try {
            this.dispatcher.resume();
        } catch {
            // catches error when dispatcher has nothing to resume
        }
    }

    stop() {
        this.client.voice.connections.array().forEach( ( c ) => {
            const vc = c.channel;
            vc.leave();
        });
        this.paused = false;
        this.repeat_instruction = 0;
        if (this.currentTimeout !== undefined) {
            clearInterval(this.currentTimeout)
        }
        this.currentTimeout = undefined;
    }

    heartbeat() {
        const now = Date.now();
        const time_passed = now-this.lastSpoke;
        if ( time_passed > 100 && !this.paused) {
            clearInterval(this.currentTimeout);
            this.currentTimeout = undefined;
            this.handleEnd();
        }
    }

    handleEnd() {
        console.log(this.repeat_instruction)
        if (this.repeat_instruction === -1) {
        } else if (this.repeat_instruction > 0) {
            this.repeat_instruction -= 1;
        }
        else {
            // just return if we like the 8 second thing.
            this.stop();
            return;
        }
        const si = this.saved_instructions
        this.play(si.vc, si.res, si.opts, this.repeat_instruction)
    }

    repeat(val) {
        this.repeat_instruction = val;
        if (val === 0) {
            return;
        }
        if (this.currentTimeout === undefined  && this.saved_instructions && Object.keys(this.saved_instructions).length > 0) {
            this.handleEnd();
        }
    }

    repeatOnceMore() {
        this.repeat_instruction += 1;
        if (this.currentTimeout === undefined && this.saved_instructions && Object.keys(this.saved_instructions).length > 0) {
            this.handleEnd();
        }
    }
    
    setUpSpeechListener() {
        // after ~8 seconds of inactivity disconnect from voice channels
        
        this.client.setInterval( () => {
            try {
                this.client.voice.connections.array().forEach( ( c ) => {
                    const vc = c.channel;
                    const n = vc.id
    
                    this.strikes[n] = this.strikes[n]+1 || 1;
                    if ( this.strikes[n] > 2 ) {
                        vc.leave();
                        this.strikes[n] = 0;
                    }
                } );
            } catch ( e ) {
                console.error( 'Client recovered from an error' );
                console.error( e )
            }
        }, 3000 );
        
    }
}

module.exports = Player