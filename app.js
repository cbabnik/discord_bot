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

const { Lottery } = require('./components/lottery');
dispatcher.registerComponent(Lottery());

module.exports = {
    client,
};