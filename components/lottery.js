const { Component } = require('../component');
const { BUCKS } = require('../constants');
const _ = require('lodash');

const ID = 'lottery';
let uuid = 0;

const SIGNS = [
    {grid_amount: 2, maze_count: 3,  emote: ':cherries:',  value: 100},
    {grid_amount: 3, maze_count: 4,  emote: ':tangerine:', value: 50},
    {grid_amount: 4, maze_count: 5,  emote: ':lemon:',     value: 25},
    {grid_amount: 8, maze_count: 6,  emote: ':melon:',     value: 10},
    {grid_amount: 4, maze_count: 5,  emote: ':deer:', special: 'Buck Roll'},
    {grid_amount: 3, maze_count: 3,  emote: ':poop:',  multiply: -1},
    {grid_amount: 3, maze_count: 4, emote: ':two:',   multiply: 2},
    {grid_amount: 1, maze_count: 3,  emote: ':seven:', multiply: 7},
];

class Lottery extends Component {
    constructor() {
        super(ID);
        this.addCommand(/\*\*(.*)\*\* rolled the slots(?:.*)and (\w+)/s, this.watchLottery);
        this.addCommand(/^-slotstats$/, (metaInfo) => this.stats(null, metaInfo));
        this.addCommand(/^-slotstats (.*)$/, this.stats);
        this.addCommand(/^-slots coin/, this.coinslots);
        this.addCommand(/^-slots grid/, this.gridslots);
        this.addCommand(/^-slots maze/, this.mazeSlots);
    }

    watchLottery(user, result, metaInfo) {
        if (metaInfo.authorId !== BUCKS.KAWAIICASINO) {
            this.setAction('message', 'Are you trying to confuse me?');
            return;
        }
        if (!this.json[user]) {
            this.json[user] = {kawaii: {wins:0, losses:0, almost: 0}}
        }
        if (result === "won") {
            this.setAction('message', 'telling colton');
            this.setAction('audio', 'sample.mp3');
            _.set(this.json, `${user}.kawaii.wins`, _.get(this.json, `${user}.kawaii.wins`, 0) + 1);
        } else if (result === "lost") {
            _.set(this.json, `${user}.kawaii.losses`, _.get(this.json, `${user}.kawaii.losses`, 0) + 1);
        } else if (result === "almost") {
            _.set(this.json, `${user}.kawaii.almost`, _.get(this.json, `${user}.kawaii.almost`, 0) + 1);
            _.set(this.json, `${user}.kawaii.losses`, _.get(this.json, `${user}.kawaii.losses`, 0) + 1);
        }
        this.saveJSON();
    }

    stats(user, metaInfo) {
        if (!user) {
            user = metaInfo.author;
        }
        if (!this.json[user]) {
            this.setAction('message', `No stats for \`${user}\``);
            return
        }
        const p = this.json[user];
        const [k, b, c, m, g] = [p.kawaii, p.buck, p.coin, p.maze, p.grid];
        this.setAction('message', `Slots Stats for ${user}:
**Kawaii Casino**: \`${k.wins} wins\` and \`${k.losses+k.almost} losses\`. ${k.almost} of those losses were almost wins. Win ratio is **${(k.wins/(k.wins+k.losses+k.almost)*100).toFixed(2)}%**
**Coin Slots**: ${c.attempts} attempts. Best streak is ${c.longest_streak} which won $${c.best}. Total winnings are $${c.winnings}. Average winnings are $${(c.winnings/c.attempts).toFixed(2)}
**Grid Slots**: ${g.attempts} attempts. Best roll gave $${g.best}. Total winnings are $${g.winnings} Average winnings are $${(g.winnings/g.attempts).toFixed(2)}
**Maze Slots**: ${m.attempts} attempts. Best roll gave $${m.best}. Longest streak is ${m.longest_streak}. Total winnings are $${m.winnings}. Average winnings are $${(m.winnings/m.attempts).toFixed(2)}
`+(this.json['buckSlotsFound']?`Buck Slots: ${m.attempts} attempts. ${b.bucks} of ${b.wins} wins were ultimate wins. Total winnings are $${b.winnings}`:`???`))
    }

    coinslots(metaInfo) {
        const user = metaInfo.author;
        let chain = 0;
        let winnings = 0;
        uuid += 1;
        this.setAction('message', `${user} rolled the slots!\nCoin Slots - Keep flipping till you lose!\n\nReward: ${winnings}`);
        this.setAction('messageId', `lottery-${uuid}`);
        this.queueAction();
        while ( Math.random() > 0.5 ) {
            chain += 1;
            winnings = Math.floor(2**(chain-1));
            this.setAction('delay', (chain+3)*.3);
            this.setAction('message', `${user} rolled the slots!\nCoin Slots - Keep flipping till you lose!\n${':moneybag:'.repeat(chain)}\nReward: ${winnings}`);
            this.setAction('editId', `lottery-${uuid}`);
            this.queueAction();
        }
        this.setAction('delay', (chain+3)*.3);
        this.setAction('message', `${user} rolled the slots!\nCoin Slots - Keep flipping till you lose!\n${':moneybag:'.repeat(chain)+':x:'}\nReward: ${winnings}`);
        this.setAction('editId', `lottery-${uuid}`);

        _.set(this.json, `${user}.coin.longest_streak`, Math.max(_.get(this.json, `${user}.coin.longest_streak`, 0), chain));
        _.set(this.json, `${user}.coin.best`, Math.max(_.get(this.json, `${user}.coin.best`, 0), winnings));
        _.set(this.json, `${user}.coin.winnings`, _.get(this.json, `${user}.coin.winnings`, 0) + winnings);
        _.set(this.json, `${user}.coin.attempts`, _.get(this.json, `${user}.coin.attempts`, 0) + 1);
        this.saveJSON();
    }

    gridslots(metaInfo) {
        const user = metaInfo.author;

        let lines = {};
        // results is a helper method which explains which rewards a user has won thus far
        const results = () => {
            let winnings = 0;
            let multiply = 1;
            SIGNS.forEach((e) => {
                if (lines[e.emote]) {
                    if (e.emote === ':poop:') {
                        winnings -= 10*lines[e.emote];
                    } else if (e.multiply) {
                        multiply *= e.multiply**lines[e.emote];
                    } else {
                        winnings += e.value*lines[e.emote];
                    }
                }
            });
            if (winnings === 0 && multiply !== 1) {
                winnings = 1;
            }
            winnings *= multiply;
            return {winnings};
        };

        let grid = [[0,0,0],[0,0,0],[0,0,0]];
        let bag = [];
        SIGNS.forEach((sign) => {bag.push(...Array(sign.grid_amount).fill(sign.emote))});
        grid = grid.map((row) => row.map(() => _.sample(bag)));

        const valid_lines = [
            [{x:0,y:0},{x:0,y:1},{x:0,y:2}],
            [{x:1,y:0},{x:1,y:1},{x:1,y:2}],
            [{x:2,y:0},{x:2,y:1},{x:2,y:2}],
            [{x:0,y:0},{x:1,y:1},{x:2,y:2}],
            [{x:2,y:0},{x:1,y:1},{x:0,y:2}],
            [{x:0,y:0},{x:1,y:0},{x:2,y:0}],
            [{x:0,y:1},{x:1,y:1},{x:2,y:1}],
            [{x:0,y:2},{x:1,y:2},{x:2,y:2}]
        ];
        valid_lines.forEach((i) => {
            if (grid[i[0].x][i[0].y] === grid[i[1].x][i[1].y] && grid[i[0].x][i[0].y] === grid[i[2].x][i[2].y]) {
                lines[grid[i[0].x][i[0].y]] = _.get(lines, grid[i[0].x][i[0].y], 0) + 1;
            }
        });
        let winnings = results().winnings;

        this.setAction('message', `${user} rolled the slots!\nGrid Slots - 8 possible rows!
**[** ${grid[0][0]}${grid[1][0]}${grid[2][0]} **]**
**[** ${grid[0][1]}${grid[1][1]}${grid[2][1]} **]**
**[** ${grid[0][2]}${grid[1][2]}${grid[2][2]} **]**
Reward: ${winnings}`);

        _.set(this.json, `${user}.grid.best`, Math.max(_.get(this.json, `${user}.grid.best`, 0), winnings));
        _.set(this.json, `${user}.grid.winnings`, _.get(this.json, `${user}.grid.attempts`, 0) + winnings);
        _.set(this.json, `${user}.grid.attempts`, _.get(this.json, `${user}.grid.attempts`, 0) + 1);
        this.saveJSON();
    }

    mazeSlots(metaInfo) {
        const user = metaInfo.author;

        let rewards = {};
        let streak = 1;
        uuid += 1;

        // results is a helper method which explains which rewards a user has won thus far
        const results = () => {
            let s = 'Sets:';
            let winnings = 0;
            let multiply = 1;
            SIGNS.forEach((e) => {
                let sets = Math.floor(rewards[e.emote]/3);
                if (sets) {
                    if (e.special) {
                        s += `\n${_.repeat(`${e.emote}`, 3 * sets)}  Reward: ${e.special}`;
                    } else if (e.multiply) {
                        s += `\n${_.repeat(`${e.emote}`, 3 * sets)}  Reward: x${e.multiply**sets} rewards`;
                        multiply *= e.multiply;
                    } else {
                        s += `\n${_.repeat(`${e.emote}`, 3 * sets)}  Reward: $${e.value*sets}`;
                        winnings += e.value;
                    }
                }
            });
            if (winnings === 0 && multiply !== 1) {
                winnings = 1;
            }
            winnings *= multiply;
            s += `\nTotal: $${winnings}`;
            s = s.length<20?'':s;
            return {s, winnings};
        };

        // setup the board
        let bag = [];
        SIGNS.forEach((e) => {
            bag.push( ...Array(e.maze_count).fill(e.emote));
        });
        bag.push( ...Array(77-bag.length).fill(':white_square_button:'));
        let grid = _.chunk(_.shuffle(bag), 11);
        let visible_grid = _.chunk(Array(77).fill(':black_large_square:'), 11);

        // setup the starting position
        let pos = {x:-1,y:-1};
        if (grid[3][5] !== ':white_square_button:') {
            pos = {x:5, y:3};
        }
        while (pos.x === -1) {
            let [x, y] = [Math.floor(Math.random()*11), Math.floor(Math.random()*7)];
            if (grid[y][x] !== ':white_square_button:') {
                pos = {x, y};
            }
        }
        visible_grid[pos.y][pos.x] = grid[pos.y][pos.x];
        rewards[grid[pos.y][pos.x]] = 1;
        this.setAction('message', `${user} rolled the slots!\nMaze Slots - Let the Journey Begin!\n${visible_grid.map(row => row.join('')).join('\n')}\n${results().s}`);
        this.setAction('messageId', `lottery-${uuid}`);

        // look around and collect fruit till you hit a deadend
        loop:
        while (true) {
            let dirs = _.shuffle([{dx: 0, dy: 1}, {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: -1, dy: 0}]);
            while (true) {
                let chosen = dirs.pop();
                let [x, y] = [(chosen.dx + pos.x + 11)%11, (chosen.dy + pos.y + 7)%7];
                if (grid[y][x] !== visible_grid[y][x]) {
                    if (grid[y][x] === ':white_square_button:') {
                        visible_grid[y][x] = grid[y][x];
                        break;
                    }
                    pos = {x, y};
                    visible_grid[y][x] = grid[y][x];
                    rewards[grid[y][x]] = _.get(rewards, grid[y][x], 0) + 1;
                    streak += 1;
                    break;
                }
                if (dirs.length === 0) {
                    break loop;
                }
            }
            this.queueAction();
            this.setAction('delay', grid[pos.y][pos.x] === ':white_square_button:'?1:2);
            this.setAction('message', `${user} rolled the slots!\nMaze Slots - Let the Journey Begin!\n${visible_grid.map(row => row.join('')).join('\n')}\n${results().s}`);
            this.setAction('editId', `lottery-${uuid}`);
        }
        let winnings = results().winnings;

        // record stats
        _.set(this.json, `${user}.maze.longest_streak`, Math.max(_.get(this.json, `${user}.maze.longest_streak`, 0), streak));
        _.set(this.json, `${user}.maze.best`, Math.max(_.get(this.json, `${user}.maze.best`, 0), winnings));
        _.set(this.json, `${user}.maze.winnings`, _.get(this.json, `${user}.maze.winnings`, 0) + winnings);
        _.set(this.json, `${user}.maze.attempts`, _.get(this.json, `${user}.maze.longest_streak`, 0) + 1);
        this.saveJSON();
    }

    buckSlots(user) {
        let bag = ['eight', 'seven', 'one', 'deer', 'bee', 'scary', 'girl', 'kiwi'];
        let roll = [_.sample(bag), _.sample(bag), _.sample(bag)];

        let winnings = 0;

        switch(roll.join(','))
        {
            case 'eight,seven,one':
                break;
            case 'seven,seven,seven':
                break;
            case 'seven,deer,seven':
                break;
            case 'deer,deer,deer':
                break;
            case 'bee,bee,bee':
                break;
            case 'scary,scary,scary':
                break;
            case 'girl,girl,girl':
                break;
            case 'kiwi,kiwi,kiwi':
                break;
            default:
                let strNum = '';
                roll.forEach((elem) => {
                    switch(elem)
                    {
                        case 'eight':
                            strNum += '8';
                            break;
                        case 'seven':
                            strNum += '7';
                            break;
                        case 'one':
                            strNum += '1';
                            break;
                    }
                });
                winnings = Number(strNum);
        }

        _.set(this.json, `${user}.maze.winnings`, _.get(this.json, `${user}.maze.winnings`, 0) + winnings);
        _.set(this.json, `${user}.maze.attempts`, _.get(this.json, `${user}.maze.longest_streak`, 0) + 1);
        this.saveJSON();
    }
}

module.exports = { lottery: new Lottery() };
