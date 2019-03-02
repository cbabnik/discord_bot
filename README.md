# Big Buck Bot

Discord bot for the server Big Buck Hunters

This is joint effort between Curtis Babnik and Kenny Hartwig

The bot is set up with a Service architecture, where many "Component"s carry out the role of Service.
They each own their own data and provide an api to one another.

![title](https://github.com/cbabnik/discord_bot/blob/master/UML%20Diagram.png)

Client is a wrapper around discord.js 's Client class, but with some config pre-set and a timer to re-login to discord.

Monitor and Actor interface with Client, as the input and output mediators.

Monitor makes no judgements on what to do with inputs, but just funnels them into log files and to Dispatcher functions

Dispatcher handles all inputs by calling into the correct component handlers and forwarding responses to Acter.
Dispatcher enlists a Scanner to parse regex.

Components register a command with Dispatcher and/or provide API for other Components. Each component has its own json storage and
takes care of possible race conditions.

Component handlers return an action which may be empty, the action specifies when and how the Acter responds.
