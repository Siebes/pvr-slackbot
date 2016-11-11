var request = require('request'),
    Deferred = require('bluebird'),
    Utils = require('./utilFunctions'),
    _ = require('lodash');

/**
 * @constructor
 */
function CouchPotato() {
    "use strict";

    function search(searchTerm) {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.CP_HOST + ':' + process.env.CP_PORT + '/api/' + process.env.CP_KEY + "/search?q=" + encodeURIComponent(searchTerm),
                headers: {
                    'User-Agent': 'Chatbot'
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json && json.success && json.movies && json.movies.length > 0) {
                        resolve(json.movies);
                    } else {
                        reject();
                    }
                }
            });
        });
    }

    function download(data) {

        var id = data.movie.imdb,
            title = data.movie.titles[0],
            profileId = data.profile._id;

        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.CP_HOST + ':' + process.env.CP_PORT + '/api/' + process.env.CP_KEY + '/movie.add?identifier=' +
                                                 encodeURIComponent(id) + '&title=' + encodeURIComponent(title) + '&profile_id=' + encodeURIComponent(profileId),
                headers: {
                    'User-Agent': 'Chatbot'
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body);
                    if (json && json.success) {
                        resolve(json.movie);
                    } else {
                        reject();
                    }
                }
            });
        });
    }

    function profiles() {
        return new Deferred(function (resolve, reject) {
            request({
                method: 'GET',
                url: 'http://' + process.env.CP_HOST + ':' + process.env.CP_PORT + '/api/' + process.env.CP_KEY + '/profile.list',
                headers: {
                    'User-Agent': 'Chatbot'
                }
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    var json = Utils.parseJSON(body),
                        validProfiles = null;
                    if (json && json.success) {
                        validProfiles = _.filter(json.list, function (profile) {
                            return profile.hide === false;
                        });
                        if (validProfiles.length > 0) {
                            resolve(validProfiles);
                        } else {
                            reject("No profiles available");
                        }
                    } else {
                        reject();
                    }
                }
            });
        });
    }

    return {
        search : search,
        profiles : profiles,
        download : download
    };
}

module.exports = new CouchPotato();