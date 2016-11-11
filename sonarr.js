var request = require('request'),
    Deferred = require('bluebird'),
    Utils = require('./utilFunctions'),
    _ = require('lodash');

/**
 * @constructor
 */
function Sonarr() {
    "use strict";

    function searchSeries(seriesId) {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'POST',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/command',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                },
                json: {
                    name: "seriesSearch",
                    seriesId: seriesId
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    }

    function rootFolders() {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/rootfolder',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json === null) {
                        reject();
                    } else {
                        resolve(json);
                    }
                }
            });
        });
    }

    function series() {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/series/',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json === null) {
                        reject();
                    } else {
                        resolve(json);
                    }
                }
            });
        });
    }

    function lookup(searchTerm) {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/series/lookup?term=' + encodeURIComponent(searchTerm),
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                }

            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json === null) {
                        reject();
                    } else {
                        resolve(json);
                    }
                }
            });
        });
    }

    function qualities() {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/profile',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                }

            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json === null) {
                        reject();
                    } else {
                        resolve(json);
                    }
                }
            });
        });
    }

    function create(data) {

        data.show.profileId = data.quality.id;
        data.show.seasonFolder = true;
        data.show.monitored = true;
        data.show.episodeFileCount = 0;
        data.show.episodeCount = 0;
        data.show.isExisting = false;
        data.show.rootFolderPath = data.folder.path;
        data.show.addOptions = {
            ignoreEpisodesWithFiles: false,
            ignoreEpisodesWithoutFiles: false,
            searchForMissingEpisodes: false
        };

        return new Deferred(function (resolve, reject) {

            request({
                method: 'POST',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/series',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                },
                json: data.show
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    _.delay(searchSeries, 5000, body.id); //search after 5 seconds :)
                    resolve(body);
                }
            });
        });
    }

    function update(existingObj, data) {
        return new Deferred(function (resolve, reject) {
            existingObj.seasons = data.show.seasons;
            existingObj.qualityProfileId = data.quality.id;
            existingObj.monitored = true;
            request({
                method: 'PUT',
                url: 'http://' + process.env.SONARR_HOST + ':' + process.env.SONARR_PORT + '/api/series',
                headers: {
                    'User-Agent': 'Chatbot',
                    'X-Api-Key': process.env.SONARR_KEY
                },
                json: existingObj
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    _.delay(searchSeries, 5000, body.id); //search after 5 seconds :)
                    resolve(body);
                }
            });
        });
    }

    function download(data) {
        return new Deferred(function (resolve, reject) {
            series()
                .then(function (series) {
                    var existingSeries = _.find(series, function (show) {
                        return show.imdbId === data.show.imdbId;
                    });
                    if (existingSeries !== undefined) {
                        update(existingSeries, data)
                            .then(function (body) {
                                resolve(body);
                            }, reject);
                    } else {
                        create(data)
                            .then(function (body) {
                                resolve(body);
                            }, reject);
                    }
                }, reject);
        });
    }

    return {
        lookup: lookup,
        qualities: qualities,
        download: download,
        rootFolders : rootFolders
    };
}

module.exports = new Sonarr();