var CouchPotato = require('./couchPotato'),
    Deferred = require('bluebird'),
    Conversation = require('./conversation'),
    _ = require('lodash');

/**
 * @constructor
 */
function CouchPotatoFunctions() {
    "use strict";

    function setup(message, data) {
        return new Deferred(function (resolve, reject) {
            var profilesDeferred = CouchPotato.profiles(),
                searchDeferred = CouchPotato.search(message.match[1]);

            Deferred.join(profilesDeferred, searchDeferred, function (profiles, movies) {
                data.profiles = profiles;
                data.movies = movies;
                resolve();
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    function finish(data) {
        return new Deferred(function (resolve, reject) {
            CouchPotato.download(data)
                .then(resolve("Downloaded with Success"), reject("Failed to download"));
        });
    }

    function askMovie(data) {
        var question = [];
        question.push("Choose Movie");
        _.forEach(data.movies, function (movie, i) {
            question.push("[" + (i + 1) + "] - " + movie.original_title + " (" + movie.year + ")");
        });
        question.push("[0] - Quit");
        return question.join("\n");
    }

    function confirmMovie(conversation) {
        return function (response, convo) {
            var isNumber = /^(\d)+$/,
                choice,
                movie;
            if (response && response.text && response.text && response.text.match(isNumber)) {
                choice = parseInt(response.text, 10);
                if (choice === 0) {
                    conversation.end(response, convo);
                } else {
                    choice = choice - 1;
                    movie = conversation.data.movies[choice];
                    if (movie && movie.in_library) {
                        convo.say(movie.original_title + " is already in your library");
                        conversation.end(response, convo);
                    } else if (movie && movie.in_wanted) {
                        convo.say(movie.original_title + " is already in your wanted list and will be downloaded when avaliable");
                        conversation.end(response, convo);
                    } else if (movie) {
                        convo.say("Selected " + movie.original_title + " (" + movie.year + ")");
                        conversation.data.movie = movie;
                        conversation.nextQuestion(response, convo);
                    } else {
                        convo.say(response.text + ": option not found");
                        conversation.silentRepeat(response, convo);
                    }
                }
            } else {
                convo.say(response.text + ": expected number");
                conversation.silentRepeat(response, convo);
            }
        };
    }

    function askProfile(data) {
        var question = [];
        question.push("Choose Profile");
        _.forEach(data.profiles, function (profile, i) {
            question.push("[" + (i + 1) + "] - " + profile.label);
        });
        question.push("[0] - Quit");
        return question.join("\n");
    }

    function confirmProfile(conversation) {
        return function (response, convo) {
            var isNumber = /^(\d)+$/,
                choice,
                profile;
            if (response && response.text && response.text && response.text.match(isNumber)) {
                choice = parseInt(response.text, 10);
                if (choice === 0) {
                    conversation.end(response, convo);
                } else {
                    choice = choice - 1;
                    profile = conversation.data.profiles[choice];
                    if (profile) {
                        convo.say("Selected " + profile.label);
                        conversation.data.profile = profile;
                        conversation.nextQuestion(response, convo);
                    } else {
                        convo.say(response.text + ": option not found");
                        conversation.silentRepeat(response, convo);
                    }
                }
            } else {
                convo.say(response.text + ": expected number");
                conversation.silentRepeat(response, convo);
            }
        };
    }

    function askSummary(data) {
        var question = [];
        question.push("Does this look correct?");
        question.push("SHOW: " + data.movie.original_title + " (" + data.movie.year + ")");
        question.push("PROFILE: " + data.profile.label);
        return question.join('\n');
    }

    function confirmSummary(conversation) {
        return function (response, convo) {
            if (response && response.text && response.text.match(conversation.bot.utterances.yes)) {
                convo.say("Downloading");
                conversation.nextQuestion(response, convo);
            } else if (response && response.text && response.text.match(conversation.bot.utterances.no)) {
                conversation.end(response, convo);
            } else {
                convo.say(response.text + ": option not found");
                conversation.silentRepeat(response, convo);
            }
        };
    }

    function initialiseConversation(bot, message) {
        var conversation = new Conversation();
        conversation.setSetup(setup)
            .addStep(askMovie, confirmMovie)
            .addStep(askProfile, confirmProfile)
            .addStep(askSummary, confirmSummary)
            .setFinish(finish)
            .start(bot, message);
    }

    return {
        initialiseConversation: initialiseConversation
    };
}

module.exports = new CouchPotatoFunctions();

