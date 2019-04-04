const { Component } = require( '../component' );
const { PERMISSION_LEVELS, DMCHANNEL, BETA } = require( '../constants' );

const ID = 'requests';
let requests;

const STATUS_ACCEPTED = 'ACCEPTED';
const STATUS_PENDING_JUDGEMENT = 'PENDING JUDGEMENT';
const STATUS_REJECTED = 'REJECTED';
const STATUS_UNREAD = 'UNREAD';

class Requests extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-request (.*)$/, this.addRequest );
        this.addCommand( /^-requests all$/, (metaInfo) => this.listRequests('all', metaInfo) );
        this.addCommand( /^-requests new$/, (metaInfo) => this.listRequests('new', metaInfo) );
        this.addCommand( /^-requests (\d+)$/, (n, metaInfo) => this.listRequests(n, metaInfo) );
        this.addCommand( /^-requests delete (\d+)$/, this.deleteRequestN );
        this.addCommand( /^-requests accept (\d+)$/, (n, metaInfo) => this.changeStatus(n, STATUS_ACCEPTED, metaInfo) );
        this.addCommand( /^-requests reject (\d+)$/, (n, metaInfo) => this.changeStatus(n, STATUS_REJECTED, metaInfo) );
        this.addCommand( /^-requests/, this.checkRequests );
        this.addCommand( /^-reply (\d+) (.+)$/, this.reply );

        if (this.json['requests'] === undefined) {
            this.json['requests'] = [];
        }
        if (this.json['uuid'] === undefined) {
            this.json['uuid'] = 0;
        }
        requests = this.json['requests'];
    }

    addRequest( request, metaInfo ) {
        this.json['uuid'] += 1;
        requests.push({uuid: this.json['uuid'], user: metaInfo.author, id: metaInfo.authorId, request, unread: true, unreadreply: false, reply: '', status: STATUS_UNREAD});
        this.setAction('Request made! You can check if the admins have read or replied to it with \`-requests\`');
        this.saveJSON();
    }

    changeStatus( n, status, metaInfo ) {
        if (!PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId)) {
            this.setAction('security', PERMISSION_LEVELS.ADMIN);
            return;
        }
        n = Number(n) - 1;
        if (requests.length <= n) {
            this.setAction('message', `There is no request#${n+1}`);
            return;
        }
        requests[n].status = status;
        this.saveJSON();
    }

    listRequests( mode, metaInfo ) {
        let admin = PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId);
        let filterA, filterB;
        let mapFn = (r, i) => ({...r, idx: i+1});
        if (admin) {
            filterA = () => true;
        } else {
            filterA = r => r.id === metaInfo.authorId;
        }
        if (mode === 'all' ) {
            filterB = () => true;
        } else if (mode === 'new' && admin) {
            filterB = r => r.unread;
        } else if (mode === 'new' ) {
            filterB = r => r.unreadreply;
        } else {
            let n = Number(mode);
            filterB = r => r.idx === n;
        }

        let msg = 'Requests:\n';
        let vr = requests.filter(filterA).map(mapFn).filter(filterB);
        for (let i = 0; i < vr.length; i++) {
            let moreMsg = `\`[${vr[i].idx}] <${vr[i].status}>\` ${vr[i].request}\n`;
            if (vr[i].reply) {
                moreMsg += `**Reply:** ${vr[i].reply}\n`;
            }
            if ((msg + moreMsg).length > 2000) {
                this.setAction('message', msg);
                msg = '';
                this.queueAction();
            }
            msg += moreMsg;

            // mark as read
            const uuidToChange = vr[i].uuid;
            const indexToChange = requests.findIndex(r => r.uuid === uuidToChange);
            if (admin) {
                requests[indexToChange].unread = false;
                if (requests[indexToChange].status.includes(STATUS_UNREAD)) {
                    requests[indexToChange].status = STATUS_PENDING_JUDGEMENT;
                }
            } else {
                requests[indexToChange].unreadreply = false;
            }
        }
        this.setAction('message', msg);
        this.saveJSON();
    }

    checkRequests( metaInfo ) {
        let filterA;
        if (PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId)) {
            filterA = () => true;
        } else {
            filterA = r => r.id === metaInfo.authorId;
        }
        let vr = requests.filter(filterA);
        let newr = vr.filter(r => r.unread);
        let newreply = vr.filter(r => r.unreadreply);
        if (PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId)) {
            this.setAction('message', `All requests:
There are \`${vr.length} total requests\`.
\`${newreply.length} unreplied to\` requests.
\`${newr.length} unread\` requests`);
        } else {
            this.setAction('message', `**${metaInfo.user}**'s requests:
You have \`${vr.length} requests\`.
\`${newreply.length} unread replies\` to requests you own.
\`${newr.length} unread\` by admins.
You can check your requests with \`-requests N\`, \`-requests new\`, or \`-requests all\``);
        }
    }

    deleteRequestN( n, metaInfo ) {
        let filterA;
        if (PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId)) {
            filterA = () => true;
        } else {
            filterA = r => r.id === metaInfo.authorId;
        }
        let vr = requests.filter(filterA);
        n = Number(n) - 1;
        if (vr.length <= n) {
            this.setAction('message', `You don't have #${n+1} requests`);
            return;
        }
        const uuidToDelete = vr[n].uuid;
        const indexToDelete = requests.findIndex(r => r.uuid === uuidToDelete);
        requests.splice(indexToDelete, 1);

        this.setAction('message', 'Request deleted');
        this.saveJSON();
    }

    reply( n, message, metaInfo ) {
        if (!PERMISSION_LEVELS.ADMIN.includes(metaInfo.authorId)) {
            this.setAction('message', `Only admins can do this.`);
            return;
        }
        n = Number(n) - 1;
        if (requests.length <= n) {
            this.setAction('message', `You don't have ${n+1} messages`);
            return;
        }
        requests[n].reply = message;
        requests[n].unreadreply = true;
        this.setAction('message', 'Reply accepted.');
        if (metaInfo.channelType === DMCHANNEL) {
            this.queueAction();
            this.setAction('channelId', BETA.MAIN_CHANNEL);
            this.setAction('message', `One of **${requests[n].user}**'s requests was replied to!`)
        }
        this.saveJSON();
    }
}

module.exports = { requests: new Requests() };
