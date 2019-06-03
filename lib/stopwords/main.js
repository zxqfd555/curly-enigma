var enStopwords = require("./en.js");
var esStopwords = require("./es.js");

function _getStopWords(language = "en") {
    if (language == "en") {
        return enStopwords.getEnglishStoplist();
    }
    if (language == "es") {
        return esStopwords.getSpanishStoplist();
    }
    console.log("unknown language! only 'en' and 'es' are supported, fallback to 'en' list");
    return enStopwords.getEnglishStopwords();
}

module.exports = {
    getStopWords: _getStopWords
};

