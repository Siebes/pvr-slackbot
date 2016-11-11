/**
 * @constructor
 */
function UtilFunctions() {
    "use strict";

    function parseJSON(body) {
        var json;
        if (body === null) {
            console.error("Series Lookup returned null");
            return null;
        }
        try {
            json = JSON.parse(body);
        } catch (e) {
            console.error("Series lookup returned invalid JSON", e);
            return null;
        }
        return json;
    }
    return {
        parseJSON : parseJSON
    };
}

module.exports = new UtilFunctions();