const uuidv4 = require( 'uuidv4' );

const { Component } = require( './component' );
const { PERMISSION_LEVELS, DMCHANNEL, CONFIG } = require( '../core/constants' );

const STATUS_ACCEPTED = 'ACCEPTED';
const STATUS_PENDING_JUDGEMENT = 'PENDING JUDGEMENT';
const STATUS_REJECTED = 'REJECTED';
const STATUS_UNREAD = 'UNREAD';

const ID = 'requests';

let requests;
let ready = false;

class Requests extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-request all$/, ( metaInfo ) => this.listRequests( 'all', metaInfo ), "requests" );
        this.addCommand( /^-requests all$/, ( metaInfo ) => this.listRequests( 'all', metaInfo ), "requests" );
        this.addCommand( /^-requests? new$/, ( metaInfo ) => this.listRequests( 'new', metaInfo ), "requests" );
        this.addCommand( /^-requests (\d+)$/, ( n, metaInfo ) => this.listRequests( n, metaInfo ), "requests" );
        this.addCommand( /^-requests delete (\d+)$/, this.deleteRequestN, "requests" );
        this.addCommand( /^-requests accept (\d+)$/, ( n, metaInfo ) => this.changeStatus( n, STATUS_ACCEPTED, undefined, metaInfo ), "requests" );
        this.addCommand( /^-requests reject (\d+)$/, ( n, metaInfo ) => this.changeStatus( n, STATUS_ACCEPTED, undefined, metaInfo ), "requests" );
        this.addCommand( /^-requests accept (\d+) (.+)$/, ( n, reply, metaInfo ) => this.changeStatus( n, STATUS_ACCEPTED, reply, metaInfo ), "requests" );
        this.addCommand( /^-requests reject (\d+) (.+)$/, ( n, reply, metaInfo ) => this.changeStatus( n, STATUS_REJECTED, reply, metaInfo ), "requests" );
        this.addCommand( /^-requests reply (\d+) (.+)$/, this.reply, "requests" );
        this.addCommand( /^-requests/, this.checkRequests, "requests" );
        this.addCommand( /^-new ?[rR]equest .*hitler.*$/, this.noHilter, "requests" );
        this.addCommand( /^-new ?[rR]equest .*http.*$/, this.noLinks, "requests" );
        this.addCommand( /^-new ?[rR]equest (.*)$/, this.addRequest, "requests" );
        this.addCommand( /^-request (.*)$/, this.requestInfo, "requests" );
    }

    bootUp() {
        (async () => {
            requests = await this.storage.get('requests', []);
            ready = true;
        })();
    }

    noHilter(mi) {
        this.setAction( 'message', `**${mi.author}**, Stop with the hitler pics.` );
    }

    noLinks(mi) {
        this.setAction( 'message', `**${mi.author}**, No links. Make it an invalid url if its important.` );
    }

    requestInfo() {
        this.setAction( 'message', 'Did you mean `-new request [request]`? or maybe `-requests`?' );
    }

    addRequest( request, metaInfo ) {
        requests.push( {uuid: uuidv4(), user: metaInfo.author, id: metaInfo.authorId, request, unread: true, unreadreply: false, reply: '', status: STATUS_UNREAD} );
        
        this.setAction( 'message', 'Request made! You can check if the admins have read or replied to it with `-requests`' );
        this.save();
    }

    changeStatus( n, status, reply, metaInfo ) {
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
            return;
        }
        n = Number( n ) - 1;
        if ( requests.length <= n ) {
            this.setAction( 'message', `There is no request#${n+1}` );
            return;
        }
        requests[n].status = status;
        if ( reply ) {
            requests[n].reply = reply;
            requests[n].unreadreply = true;
            this.setAction( 'message', 'Reply accepted.' );
            if ( metaInfo.channelType === DMCHANNEL ) {
                this.queueAction();
                this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
                this.setAction( 'message', `One of **${requests[n].user}**'s requests was replied to!` );
            }
        } else {
            this.setAction( 'message', 'Status updated' );
        }
        this.save();
    }

    listRequests( mode, metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        const admin = PERMISSION_LEVELS.ADMIN.includes( id );
        let filterA, filterB;
        const mapFn = ( r, i ) => ( {...r, idx: i+1} );
        if ( admin ) {
            filterA = () => true;
        } else {
            filterA = r => r.id === id;
        }
        if ( mode === 'all' ) {
            filterB = () => true;
        } else if ( mode === 'new' && admin ) {
            filterB = r => r.unread;
        } else if ( mode === 'new' ) {
            filterB = r => r.unreadreply;
        } else {
            const n = Number( mode );
            filterB = r => r.idx === n;
        }

        let msg;
        if ( admin ) {
            msg = 'Requests:\n';
        } else {
            msg = `**${user}**'s Requests:\n`;
        }
        const vr = requests.filter( filterA ).map( mapFn ).filter( filterB );
        for ( let i = 0; i < vr.length; i++ ) {
            let moreMsg;
            if ( admin ) {
                moreMsg = `\`[${vr[i].idx}] <${vr[i].status}> ${vr[i].user}:\` ${vr[i].request}\n`;
            } else {
                moreMsg = `\`[${vr[i].idx}] <${vr[i].status}>\` ${vr[i].request}\n`;
            }
            if ( vr[i].reply ) {
                moreMsg += `**Reply:** ${vr[i].reply}\n`;
            }
            if ( ( msg + moreMsg ).length > 2000 ) {
                this.setAction( 'message', msg );
                msg = '';
                this.queueAction();
            }
            msg += moreMsg;

            // mark as read
            const uuidToChange = vr[i].uuid;
            const indexToChange = requests.findIndex( r => r.uuid === uuidToChange );
            if ( admin ) {
                requests[indexToChange].unread = false;
                if ( requests[indexToChange].status.includes( STATUS_UNREAD ) ) {
                    requests[indexToChange].status = STATUS_PENDING_JUDGEMENT;
                }
            } else {
                requests[indexToChange].unreadreply = false;
            }
        }
        this.setAction( 'message', msg );
        this.save();
    }

    checkRequests( metaInfo ) {
        let filterA;
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            filterA = () => true;
        } else {
            filterA = r => r.id === metaInfo.authorId;
        }
        const vr = requests.filter( filterA );
        const newr = vr.filter( r => r.unread );
        const newreply = vr.filter( r => r.unreadreply );
        const needsreply = vr.filter( r => r.reply === '' );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            this.setAction( 'message', `All requests:
There are \`${vr.length} total requests\`.
\`${needsreply.length} unreplied to\` requests.
\`${newr.length} unread\` requests` );
        } else {
            this.setAction( 'message', `**${metaInfo.author}**'s requests:
You have \`${vr.length} requests\`.
\`${newreply.length} unread replies\` to requests you own.
\`${newr.length} unread\` by admins.
You can check your requests with \`-requests N\`, \`-requests new\`, or \`-requests all\`` );
        }
        this.save();
    }

    deleteRequestN( n, metaInfo ) {
        let filterA;
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            filterA = () => true;
        } else {
            filterA = r => r.id === metaInfo.authorId;
        }
        const vr = requests.filter( filterA );
        n = Number( n ) - 1;
        if ( vr.length <= n ) {
            this.setAction( 'message', `You don't have ${n+1} requests` );
            return;
        }
        const uuidToDelete = vr[n].uuid;
        const indexToDelete = requests.findIndex( r => r.uuid === uuidToDelete );
        requests.splice( indexToDelete, 1 );

        this.setAction( 'message', 'Request deleted' );
        this.save();
    }

    reply( n, message, metaInfo ) {
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            this.setAction( 'message', 'Only admins can do this.' );
            return;
        }
        n = Number( n ) - 1;
        if ( requests.length <= n ) {
            this.setAction( 'message', `You don't have ${n+1} messages` );
            return;
        }
        requests[n].reply = message;
        requests[n].unreadreply = true;
        this.setAction( 'message', 'Reply accepted.' );
        if ( metaInfo.channelType === DMCHANNEL ) {
            this.queueAction();
            this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
            this.setAction( 'message', `One of **${requests[n].user}**'s requests was replied to!` );
        }
        this.save();
    }

    // helpers
    save() {
        if (ready)
            this.storage.set("requests", requests)
    }

}

module.exports = { requests: new Requests() };
