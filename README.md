# Big Buck Bot

Discord bot for the server **Big Buck Hunters**

### Next Updates
![Big Refactor Update](https://github.com/cbabnik/discord_bot/blob/master/res/images/updates/bigrefactor.png)
Followed by the Adventure Update, Casino Update, Shoppalooza Update, Underworld Update, Slime Fight

### Setup Guide

1. Install each of
    1. nodejs 9.x
    1. ffmpeg
        1. download
        1. extract
        1. add bin directory to path
1. clone package
1. run `npm install`

### Architecture

The bot is set up with a Service architecture, where many "Component"s carry out the role of Service.
They each own their own data and provide an api to one another.

![UML Diagram](https://github.com/cbabnik/discord_bot/blob/master/res/diagrams/UML%20Diagram.png)

**Client** is a thin wrapper around discord.js 's Client class. The purpose of this class is two-fold. To set some sensible default settings, and to manage the clients connection with discord and inactive broadcast channels.

**Dispatcher** acts as the input mediator for Client's events. It is made aware of all Component commands through its method registerComponent, and matches user messages to the correct component functions.
Dispatcher enlists a black box Scanner to parse a growing list of regex.

**Actor** acts as the output mediator for Client. Complicated logic for interacting with Client is encapsulated into a list of ACTIONS handled by Actor. This makes more complicated actions simpler and safer than allowing Components to directly interact with Client.

**Component**s register a command with Dispatcher and/or provide API for other Components. Each component has its own json storage and is responsible for its own potential race conditions.

*Monitor previously acted as an intermediate between Dispatcher and Client, and took care of logging. As Discord has good auditting records, Monitor has been removed.*

### Screenshots

![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/mslots.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/gslots.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/cslots.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/help.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/quote.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/roll.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/alias.png)
![](https://github.com/cbabnik/discord_bot/blob/master/res/images/screenshots/calendar.png)

### Current Components

**Lottery** - 
Everyones favourite module, has 6 types of slot machines to waste time with.

**Bank** - 
Safely manages currency amounts, and offers commands for users to give credits to or create "iou"s for other users.

**Payroll** - 
Twice per day at 10:19, gives everyone on the server a few credits income.

**Audio** - 
Broadcasts sound clips from its library of 50+ sound clips, or from any youtube url.

**Utility** - 
Provides useful commands like randoming a string from a list, flipping a coin, aliassing shortcuts, etc.

**Admin** - 
Admin component gives me the ability to spawn credits, items, and manage the client from within Discord

**Quotes** - 
Allows users to add quotes for anyone on the server, and can pull up quotes at random for fun

**Requests** - 
Users can create requests for the admins to look at and respond to.

**Help** - 
Provides lists of available commands and orienting information regarding most of the commands.

**Calendar** - 
Wishes users happy birthday, announces holidays, and provides calendar info.

**Shop** - 
Admittedly pretty empty for now, Shop allows users to trade credits for small trinket items

**Inventory** - 
Safely manages item possesion.
