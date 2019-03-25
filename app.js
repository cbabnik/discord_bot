const fs = require('fs');

const { Client } = require('./client');
const { DispatcherGenerator } = require('./dispatch');
const { Monitor } = require('./monitor');
const { Scanner } = require('./scan');
const { Actor } = require('./actor');
const { LOGIN_TOKEN } = require('./auth');
const { MAX_MESSAGES } = require('./constants');

const client = Client(MAX_MESSAGES, LOGIN_TOKEN);
const actor = Actor(client);
const dispatcher = DispatcherGenerator( Scanner )( actor );
Monitor(client, dispatcher);

dispatcher.registerComponent(require('./components/utility').utility);
dispatcher.registerComponent(require('./components/help').help);
dispatcher.registerComponent(require('./components/audio').audio);
dispatcher.registerComponent(require('./components/pictures').pictures);

if (fs.existsSync('./components/secret.js')) {
    dispatcher.registerComponent(require('./components/secret').secret);
}
