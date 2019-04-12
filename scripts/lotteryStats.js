/* no-console: 2 */

const { lottery } = require( '../components/lottery' );
const { bank } = require( '../components/bank' );
const { pictures } = require( '../components/pictures');
const { CONFIG_DEFAULTS } = require( '../constants' );

const _ = require('lodash');
const ChartjsNode = require('chartjs-node');
//const Chart = require('chart.js');
//Chart.defaults.global.defaultColor = 'rgba(1,0,0,1)';

const sinon = require( 'sinon' );

const START_AMOUNT = 999999999;
const metaInfo = {
    channelId: CONFIG_DEFAULTS.MAIN_CHANNEL,
    author: 'test',
    authorId: '0'
};
let report = {};
let lastWinnings = 0;
let buckRolls = 0;

const reportWinnings = (winnings, type, cost) => {
    _.set(report, `${type}.winnings`, _.get(report, `${type}.winnings`, 0) + winnings);
    if ( winnings < 0) {
        _.set(report, `${type}.bigLoss`, _.get(report, `${type}.bigLoss`, 0) + 1);
    } else if ( winnings === 0) {
        _.set(report, `${type}.losses`, _.get(report, `${type}.losses`, 0) + 1);
    } else if ( winnings < cost ) {
        _.set(report, `${type}.partialWin`, _.get(report, `${type}.partialWin`, 0) + 1);
    } else if ( winnings === cost ) {
        _.set(report, `${type}.tie`, _.get(report, `${type}.tie`, 0) + 1);
    } else if ( winnings > cost ) {
        _.set(report, `${type}.wins`, _.get(report, `${type}.wins`, 0) + 1);
    }
    _.set(report, `${type}.graph[${winnings}]`, _.get(report, `${type}.graph[${winnings}]`, 0) + 1)
};

sinon.restore();
sinon.stub( lottery, 'saveJSON' );
sinon.stub( lottery, 'offLimitsFor' );
sinon.stub( lottery, 'isOffLimits').callsFake(() => false);
sinon.stub( lottery, 'createImage').callsFake(() => '');
sinon.stub( lottery, 'hasHolyMantle' ).callsFake(() => false);
sinon.stub( bank, 'saveJSON' );
sinon.stub( pictures, 'saveJSON' );
sinon.stub( lottery, 'setAction' );

bank.json = {
    '0': {
        'credits': START_AMOUNT
    }
};

lottery.json = {};
lottery.useLodashInContext();

for ( let i = 0; i < 10000; i++ ) {
    if (i%10000 === 0) {
        console.log(`${i/1000}%`);
    }
    lottery.coinslots(metaInfo);
    const winnings = lottery.json['0']['coin']['winnings'] - lastWinnings;
    lastWinnings = lottery.json['0']['coin']['winnings'];
    reportWinnings(winnings, 'coin', 1);
}
report.coin.buckRolls = _.get(lottery.json['0'], 'buck.attempts', 0);

lastWinnings = 0;
_.set(lottery.json['0'], 'buck', {});
for ( let i = 0; i < 10000; i++ ) {
    if (i%10000 === 0) {
        console.log(`${i/1000}%`);
    }
    lottery.gridslots(metaInfo);
    const winnings = lottery.json['0']['grid']['winnings'] - lastWinnings;
    lastWinnings = lottery.json['0']['grid']['winnings'];
    reportWinnings(winnings, 'grid', 5);
}
report.grid.buckRolls = _.get(lottery.json['0'], 'buck.attempts', 0);

_.set(lottery.json['0'], 'buck', {});
lastWinnings = 0;
for ( let i = 0; i < 10000; i++ ) {
    if (i%10000 === 0) {
        console.log(`${i/1000}%`);
    }
    lottery.mazeSlots(metaInfo);
    const winnings = lottery.json['0']['maze']['winnings'] - lastWinnings;
    lastWinnings = lottery.json['0']['maze']['winnings'];
    reportWinnings(winnings, 'maze', 20);
}
report.maze.buckRolls = _.get(lottery.json['0'], 'buck.attempts', 0);

lastWinnings = 0;
_.set(lottery.json['0'], 'buck', {});
for ( let i = 0; i < 10000; i++ ) {
    if (i%10000 === 0) {
        console.log(`${i/1000}%`);
    }
    lottery.buckSlots('test','0');
    const winnings = lottery.json['0']['buck']['winnings'] - lastWinnings;
    lastWinnings = lottery.json['0']['buck']['winnings'];
    reportWinnings(winnings, 'buck', 0);
}
report.buck.buckRolls = _.get(lottery.json['0'], 'buck.attempts', 0);

console.log(lottery.json);
console.log(bank.json);
console.log(report);

const draw = (name,data) => {
    let chartNode = new ChartjsNode(600, 600);
    let chartJSOptions =  {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: '# of Occurences',
                data: Object.values(data),
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,1)',
                pointRadius: 0,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: name,
            }
        }
    };
    return chartNode.drawChart(chartJSOptions)
        .then(() => {
            return chartNode.getImageBuffer('image/png');
        })
        .then(buffer => {
            return chartNode.getImageStream('image/png');
        })
        .then(streamResult => {
            return chartNode.writeImageToFile('image/png', `./images/charts/${name}.png`);
        })
        .then(() => {
            console.log(`${name} written`)
        });
};

const draw2 = (name,data) => {
    let chartNode = new ChartjsNode(600, 600);
    let chartJSOptions =  {
        type: 'line',
        data: {
            labels: Object.keys(data).filter(k => k > 100),
            datasets: [{
                label: '# of Occurences',
                data: Object.keys(data).filter(k => k > 100).map(k => data[k]),
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,1)',
                pointRadius: 0,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: name,
            }
        }
    };
    return chartNode.drawChart(chartJSOptions)
        .then(() => {
            return chartNode.getImageBuffer('image/png');
        })
        .then(buffer => {
            return chartNode.getImageStream('image/png');
        })
        .then(streamResult => {
            return chartNode.writeImageToFile('image/png', `./images/charts/${name}.png`);
        })
        .then(() => {
            console.log(`${name} written`)
        });
};

const draw3 = (name,data) => {
    let chartNode = new ChartjsNode(600, 600);
    let chartJSOptions =  {
        type: 'bar',
        data: {
            labels: ['< 0', '0', '1 to 25', '26 to 100', '100+'],
            datasets: [{
                label: '# of Occurences',
                data: [
                    _.sum(Object.keys(data).filter(k => k < 0).map(k => data[k])),
                    _.sum(Object.keys(data).filter(k => k === '0').map(k => data[k])),
                    _.sum(Object.keys(data).filter(k => k > 0 && k <= 25).map(k => data[k])),
                    _.sum(Object.keys(data).filter(k => k > 25 && k <= 100).map(k => data[k])),
                    _.sum(Object.keys(data).filter(k => k > 100).map(k => data[k]))
                    ],
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,1)',
                pointRadius: 0,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: name,
            }
        }
    };
    return chartNode.drawChart(chartJSOptions)
        .then(() => {
            return chartNode.getImageBuffer('image/png');
        })
        .then(buffer => {
            return chartNode.getImageStream('image/png');
        })
        .then(streamResult => {
            return chartNode.writeImageToFile('image/png', `./images/charts/${name}.png`);
        })
        .then(() => {
            console.log(`${name} written`)
        });
};

draw('coin', report.coin.graph);
draw('grid', report.grid.graph);
draw('maze', report.maze.graph);
draw('buck', report.buck.graph);
draw2('coinzoom', report.coin.graph);
draw2('gridzoom', report.grid.graph);
draw2('mazezoom', report.maze.graph);
draw2('buckzoom', report.buck.graph);
draw3('coinbar', report.coin.graph);
draw3('gridbar', report.grid.graph);
draw3('mazebar', report.maze.graph);
draw3('buckbar', report.buck.graph);

sinon.restore();