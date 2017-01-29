"use strict";

var Botkit = require('botkit'),
    controller = Botkit.slackbot({retry: Infinity}),
    SonarrFunctions = require('./sonarrFunctions'),
    CouchPotatoFunctions = require('./couchPotatoFunctions');


if (!process.env.SLACK_TOKEN) {
    console.log('Error: Specify SLACK_TOKEN in environment');
    process.exit(1);
}

if (!process.env.SONARR_PORT || !process.env.SONARR_HOST || !process.env.SONARR_KEY) {
    console.log("Error: Specify SONARR_PORT, SONARR_HOST, SONARR_KEY in environment");
    process.exit(1);
}

if (!process.env.CP_PORT || !process.env.CP_HOST || !process.env.CP_KEY) {
    console.log("Error: Specify CP_PORT, CP_HOST, CP_KEY in environment");
    process.exit(1);
}

controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM(function (err) {
    if (err) {
        throw new Error(err);
    }
});

var tv = ['download tv (.+)'];
var movie = ['download movie (.+)', 'download film (.+)'];

controller.hears(tv, ['direct_message'], function (bot, message) {
    SonarrFunctions.initialiseConversation(bot, message);
});

controller.hears(movie, ['direct_message'], function (bot, message) {
    CouchPotatoFunctions.initialiseConversation(bot, message);
});

controller.hears(['help'], ['direct_message'], function (bot, message) {
    bot.reply(message, 'I am a BOT that downloads TV Shows and Movies. \n' +
        'To Download a Movie type "Download Movie" followed by the Movies name \n' +
        'To Download a TV Show type "Download TV" followed by the TV shows name');
});