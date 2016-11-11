var Sonarr = require('./sonarr'),
    Utils = require('./utilFunctions'),
    Deferred = require('bluebird'),
    Conversation = require('./conversation'),
    _ = require('lodash');

/**
 * @constructor
 */
function SonarrFunctions() {
    "use strict";

    function setup(message, data) {
        return new Deferred(function (resolve, reject) {
            var qualitiesDeferred = Sonarr.qualities(),
                seriesDeferred = Sonarr.lookup(message.match[1]),
                rootFolderDeferred = Sonarr.rootFolders();

            Deferred.join(qualitiesDeferred, seriesDeferred, rootFolderDeferred, function (qualities, series, rootFolders) {
                data.qualities = qualities;
                data.series = series;
                data.rootFolders = rootFolders;
                resolve();
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    function finish(data) {
        return new Deferred(function (resolve, reject) {
            Sonarr.download(data)
                .then(resolve("Downloaded with Success"), reject("Failed to download"));
        });
    }

    function askSeries(data) {
        var question = [];
        question.push("Choose Series");
        _.forEach(data.series, function (show, i) {
            question.push("[" + (i + 1) + "] - " + show.title + " (" + show.year + ")");
        });
        question.push("[0] - Quit");
        return question.join("\n");
    }

    function confirmSeries(conversation) {
        return function (response, convo) {
            var isNumber = /^(\d)+$/,
                choice,
                show;
            if (response && response.text && response.text && response.text.match(isNumber)) {
                choice = parseInt(response.text, 10);
                if (choice === 0) {
                    conversation.end(response, convo);
                } else {
                    choice = choice - 1;
                    show = conversation.data.series[choice];
                    if (show) {
                        convo.say("Selected " + show.title + " (" + show.year + ")");
                        conversation.data.show = show;
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

    function askQuality(data) {
        var question = [];
        question.push("Choose Quality");
        _.forEach(data.qualities, function (quality, i) {
            question.push("[" + (i + 1) + "] - " + quality.name);
        });
        question.push("[0] - Quit");
        return question.join("\n");
    }

    function confirmQuality(conversation) {
        return function (response, convo) {
            var isNumber = /^(\d)+$/,
                choice,
                quality;
            if (response && response.text && response.text && response.text.match(isNumber)) {
                choice = parseInt(response.text, 10);
                if (choice === 0) {
                    conversation.end(response, convo);
                } else {
                    choice = choice - 1;
                    quality = conversation.data.qualities[choice];
                    if (quality) {
                        convo.say("Selected " + quality.name);
                        conversation.data.quality = quality;
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

    function askFolder(data) {
        var question = [];
        question.push("What folder should I save this in?");
        _.forEach(data.rootFolders, function (folder, i) {
            question.push("[" + (i + 1) + "] - " + folder.path);
        });
        question.push("[0] - Quit");
        return question.join("\n");
    }

    function confirmFolder(conversation) {
        return function (response, convo) {
            var isNumber = /^(\d)+$/,
                choice,
                folder;
            if (response && response.text && response.text && response.text.match(isNumber)) {
                choice = parseInt(response.text, 10);
                if (choice === 0) {
                    conversation.end(response, convo);
                } else {
                    choice = choice - 1;
                    folder = conversation.data.rootFolders[choice];
                    if (folder) {
                        convo.say("Selected " + folder.path);
                        conversation.data.folder = folder;
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
    function preconditionFolder(data) {
        if (data.rootFolders && data.rootFolders.length === 1) {
            data.folder = data.rootFolders[0];
            return false;
        }
        return true;
    }

    function askSeasons(data) {
        var question = [];
        question.push("Which seasons should I download? (separate with space e.g. 1 2 3)");
        _.forEach(data.show.seasons, function (season, i) {
            if (season.seasonNumber !== 0) { // don't allow specials
                question.push("[" + season.seasonNumber + "] - Season " + season.seasonNumber);
            }
        });
        question.push("[" + (data.show.seasonCount + 1) + "] - ALL");
        question.push("[0] - Quit");
        return question.join('\n');
    }

    function confirmSeasons(conversation) {
        return function (response, convo) {
            var isNumbers = /^( *\d+ *)+$/,
                seasonsSelected,
                res;
            if (response && response.text && response.text && response.text.match(isNumbers)) {
                response.text = response.text.replace(/ +/g, " "); //remove multiple spaces
                seasonsSelected = response.text.split(" ");

                // ALL SELECTED
                if (_.find(seasonsSelected, function (season) {
                        return parseInt(season, 10) === (conversation.data.show.seasonCount + 1);
                    })) {
                    _.forEach(conversation.data.show.seasons, function (season) {
                        if (season.seasonNumber !== 0) {
                            season.monitored = true;
                        }
                    });
                    convo.say("Added all seasons");
                    conversation.nextQuestion(response, convo);
                    // QUIT SELECTED
                } else if (_.find(seasonsSelected, function (season) {
                        return parseInt(season, 10) === 0;
                    })) {
                    conversation.end(response, convo);
                    // SPECIFIC SEASONS SELECTED
                } else {
                    res = [];
                    res.push("Added Seasons: ");
                    _.forEach(seasonsSelected, function (season) {
                        var foundSeason = _.find(conversation.data.show.seasons, function (showSeason) {
                            return showSeason.seasonNumber === parseInt(season, 10);
                        });
                        if (foundSeason) {
                            foundSeason.monitored = true;
                            res.push(foundSeason.seasonNumber);
                        }
                    });
                    if (res.length === 1) { //no seasons added
                        convo.say(response.text + ": option not found");
                        conversation.silentRepeat(response, convo);
                    } else {
                        convo.say(res.join("\n"));
                        conversation.nextQuestion(response, convo);
                    }
                }
            } else {
                convo.say(response.text + ": option not found");
                conversation.silentRepeat(response, convo);
            }
        };
    }

    function askSummary(data) {
        var question = [],
            seasonsSelected = data.show.seasons.filter(function (season) {
                return season.monitored === true;
            }).map(function (season) {
                return season.seasonNumber;
            }).join(", ");
        question.push("Does this look correct?");
        question.push("SHOW: " + data.show.title + " (" + data.show.year + ")");
        question.push("QUALITY: " + data.quality.name);
        question.push("FOLDER: " + data.folder.path);
        question.push("SEASONS: " + seasonsSelected);
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
            .addStep(askSeries, confirmSeries)
            .addStep(askSeasons, confirmSeasons)
            .addStep(askQuality, confirmQuality)
            .addStep(askFolder, confirmFolder, preconditionFolder)
            .addStep(askSummary, confirmSummary)
            .setFinish(finish)
            .start(bot, message);
    }

    return {
        initialiseConversation: initialiseConversation
    };
}

module.exports = new SonarrFunctions();

