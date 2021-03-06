(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var extractor = require("../lib/main.js");
getKWords = extractor.getKWords


},{"../lib/main.js":2}],2:[function(require,module,exports){
var stopwords = require("./stopwords/main.js");

function _tokenizeText(text, stoplist) {
    var punctuationsStr = ".?!,;:-";
    var quotesStr = "\"'<>()[]{}";

    var textLength = text.length;
    var currentWord = "";
    var rawTokens = text.split("\n").join(" ").split("\t").join(" ").split(" ");
    var result = [];

    for (var i = 0; i < rawTokens.length; ++i) {
        var token = rawTokens[i];
        var hasSeparatorAfter = false;
        while (token.length > 0 && punctuationsStr.indexOf(token[token.length - 1]) != -1) {
            token = token.substring(0, token.length - 1);
            hasSeparatorAfter = true;
        }
        while (token.length > 0 && quotesStr.indexOf(token[token.length - 1]) != -1) {
            token = token.substring(0, token.length - 1);
        }
        while (token.length > 0 && quotesStr.indexOf(token[0]) != -1) {
            token = token.substring(1, token.length - 1);
        }
        token = token.toLowerCase();
        if (token.length >= 2 && token[token.length - 2] == "'" && token[token.length - 1] == "s") {
            token = token.substring(0, token.length - 2);
        }
        if (token.length > 0) {
            if (stoplist.has(token)) {
                result.push(".");
            } else {
                result.push(token);
            }
        }
        if (hasSeparatorAfter && (result.length == 0 || result[result.length - 1] != ".")) {
            result.push(".");
        }
    }

    return result;
}

function _buildCandidates(titleTokens, textTokens) {
    // Calculate stats
    
    console.log("hi");

    var candidateOccurrence = {};
    var candidateTitleOccurrence = {};
    var candidateFirstOccurrencePosition = {};
    for (var windowSize = 1; windowSize <= 3; ++windowSize) {
        for (var firstWordIdx = 0; firstWordIdx < textTokens.length - windowSize + 1; ++firstWordIdx) {
            var candidate = "";
            var hasSeparator = false;
            for (var i = 0; i < windowSize; ++i) {
                if (candidate != "") {
                    candidate += " ";
                }
                if (textTokens[firstWordIdx + i] == ".") {
                    hasSeparator = true;
                    break;
                }
                candidate += textTokens[firstWordIdx + i];
            }
            if (hasSeparator) {
                continue;
            }
            if (!(candidate in candidateOccurrence)) {
                candidateOccurrence[candidate] = 0;
                candidateTitleOccurrence[candidate] = 0;
                candidateFirstOccurrencePosition[candidate] = firstWordIdx;
                for (var i = 0; i < titleTokens.length - windowSize + 1; ++i) {
                    var isMatching = true;
                    for (var j = 0; j < windowSize; ++j) {
                        if (titleTokens[i + j] != textTokens[firstWordIdx + j]) {
                            isMatching = false;
                            break;
                        }
                    }
                    if (isMatching) {
                        candidateTitleOccurrence[candidate] = candidateTitleOccurrence[candidate] + 1;
                    }
                }
            }
            candidateOccurrence[candidate] = candidateOccurrence[candidate] + 1;
        }
    }

    // Build candidates
    var processedCandidates = new Set;
    var candidates = [];

    for (var windowSize = 1; windowSize <= 3; ++windowSize) {
        for (var firstWordIdx = 0; firstWordIdx < textTokens.length - windowSize + 1; ++firstWordIdx) {
            var candidate = "";
            var hasSeparator = false;
            for (var i = 0; i < windowSize; ++i) {
                if (candidate != "") {
                    candidate += " ";
                }
                if (textTokens[firstWordIdx + i] == ".") {
                    hasSeparator = true;
                    break;
                }
                candidate += textTokens[firstWordIdx + i];
            }
            if (hasSeparator || processedCandidates.has(candidate)) {
                continue;
            }
            processedCandidates.add(candidate);

            var C1 = 0;
            var C2 = 0;
            for (var i = 0; i < windowSize; ++i) {
                var subword = textTokens[firstWordIdx + i];
                if (windowSize == 2) {
                    C1 += candidateOccurrence[subword];
                } else if (windowSize == 3) {
                    C2 += candidateOccurrence[subword];
                }
            }

            candidateScore = (
                5.63055325e-01 * candidateOccurrence[candidate] +
                2.73927772e+00 * candidateTitleOccurrence[candidate] -
                8.59746376e-04 * candidateFirstOccurrencePosition[candidate] +
                7.66210243e-02 * C1 +
                2.08424009e-02 * C2
            );

            candidates.push([candidateScore, candidate]);
        }
    }

    return candidates;
}

function _compareCandidates(a, b) {
    if (a[0] < b[0]) {
        return 1;
    } else if (a[0] > b[0]) {
        return -1;
    }
    return 0;
}

function getKWords(title, text, language = "en") {
    var titleTokens = _tokenizeText(text, stopwords.getStopWords(language));
    var textTokens = _tokenizeText(text, stopwords.getStopWords(language));

    var weightedCandidates = _buildCandidates(titleTokens, textTokens);
    weightedCandidates.sort(_compareCandidates);
    
    var result = [];
    var resultSize = 10;
    if (resultSize > weightedCandidates.length) {
        resultSize = weightedCandidates.length;
    }
    for (var i = 0; i < resultSize; ++i) {
        result.push(weightedCandidates[i][1]);
    }

    return result;
}

module.exports = {
    getKWords: getKWords
}


},{"./stopwords/main.js":5}],3:[function(require,module,exports){
function _getEnglishStoplist() {
    r = new Set();
    r.add("a");
    r.add("about");
    r.add("above");
    r.add("across");
    r.add("after");
    r.add("again");
    r.add("against");
    r.add("all");
    r.add("almost");
    r.add("alone");
    r.add("along");
    r.add("already");
    r.add("also");
    r.add("although");
    r.add("always");
    r.add("among");
    r.add("an");
    r.add("and");
    r.add("another");
    r.add("any");
    r.add("anybody");
    r.add("anyone");
    r.add("anything");
    r.add("anywhere");
    r.add("are");
    r.add("area");
    r.add("areas");
    r.add("around");
    r.add("as");
    r.add("ask");
    r.add("asked");
    r.add("asking");
    r.add("asks");
    r.add("at");
    r.add("away");
    r.add("b");
    r.add("back");
    r.add("backed");
    r.add("backing");
    r.add("backs");
    r.add("be");
    r.add("because");
    r.add("became");
    r.add("become");
    r.add("becomes");
    r.add("been");
    r.add("before");
    r.add("began");
    r.add("behind");
    r.add("being");
    r.add("beings");
    r.add("best");
    r.add("better");
    r.add("between");
    r.add("big");
    r.add("both");
    r.add("but");
    r.add("by");
    r.add("c");
    r.add("came");
    r.add("can");
    r.add("cannot");
    r.add("case");
    r.add("cases");
    r.add("certain");
    r.add("certainly");
    r.add("clear");
    r.add("clearly");
    r.add("come");
    r.add("could");
    r.add("d");
    r.add("did");
    r.add("differ");
    r.add("different");
    r.add("differently");
    r.add("do");
    r.add("does");
    r.add("done");
    r.add("down");
    r.add("downed");
    r.add("downing");
    r.add("downs");
    r.add("during");
    r.add("e");
    r.add("each");
    r.add("early");
    r.add("either");
    r.add("end");
    r.add("ended");
    r.add("ending");
    r.add("ends");
    r.add("enough");
    r.add("even");
    r.add("evenly");
    r.add("ever");
    r.add("every");
    r.add("everybody");
    r.add("everyone");
    r.add("everything");
    r.add("everywhere");
    r.add("f");
    r.add("face");
    r.add("faces");
    r.add("fact");
    r.add("facts");
    r.add("far");
    r.add("felt");
    r.add("few");
    r.add("find");
    r.add("finds");
    r.add("first");
    r.add("for");
    r.add("four");
    r.add("from");
    r.add("full");
    r.add("fully");
    r.add("further");
    r.add("furthered");
    r.add("furthering");
    r.add("furthers");
    r.add("g");
    r.add("gave");
    r.add("general");
    r.add("generally");
    r.add("get");
    r.add("gets");
    r.add("give");
    r.add("given");
    r.add("gives");
    r.add("go");
    r.add("going");
    r.add("good");
    r.add("goods");
    r.add("got");
    r.add("great");
    r.add("greater");
    r.add("greatest");
    r.add("group");
    r.add("grouped");
    r.add("grouping");
    r.add("groups");
    r.add("h");
    r.add("had");
    r.add("has");
    r.add("have");
    r.add("having");
    r.add("he");
    r.add("her");
    r.add("herself");
    r.add("here");
    r.add("high");
    r.add("higher");
    r.add("highest");
    r.add("him");
    r.add("himself");
    r.add("his");
    r.add("how");
    r.add("however");
    r.add("i");
    r.add("if");
    r.add("important");
    r.add("in");
    r.add("interest");
    r.add("interested");
    r.add("interesting");
    r.add("interests");
    r.add("into");
    r.add("is");
    r.add("it");
    r.add("its");
    r.add("itself");
    r.add("j");
    r.add("just");
    r.add("k");
    r.add("keep");
    r.add("keeps");
    r.add("kind");
    r.add("knew");
    r.add("know");
    r.add("known");
    r.add("knows");
    r.add("l");
    r.add("large");
    r.add("largely");
    r.add("last");
    r.add("later");
    r.add("latest");
    r.add("least");
    r.add("less");
    r.add("let");
    r.add("lets");
    r.add("like");
    r.add("likely");
    r.add("long");
    r.add("longer");
    r.add("longest");
    r.add("m");
    r.add("made");
    r.add("make");
    r.add("making");
    r.add("man");
    r.add("many");
    r.add("may");
    r.add("me");
    r.add("member");
    r.add("members");
    r.add("men");
    r.add("might");
    r.add("more");
    r.add("most");
    r.add("mostly");
    r.add("mr");
    r.add("mrs");
    r.add("much");
    r.add("must");
    r.add("my");
    r.add("myself");
    r.add("n");
    r.add("necessary");
    r.add("need");
    r.add("needed");
    r.add("needing");
    r.add("needs");
    r.add("never");
    r.add("new");
    r.add("newer");
    r.add("newest");
    r.add("next");
    r.add("no");
    r.add("non");
    r.add("not");
    r.add("nobody");
    r.add("noone");
    r.add("nothing");
    r.add("now");
    r.add("nowhere");
    r.add("number");
    r.add("numbered");
    r.add("numbering");
    r.add("numbers");
    r.add("o");
    r.add("of");
    r.add("off");
    r.add("often");
    r.add("old");
    r.add("older");
    r.add("oldest");
    r.add("on");
    r.add("once");
    r.add("one");
    r.add("only");
    r.add("open");
    r.add("opened");
    r.add("opening");
    r.add("opens");
    r.add("or");
    r.add("order");
    r.add("ordered");
    r.add("ordering");
    r.add("orders");
    r.add("other");
    r.add("others");
    r.add("our");
    r.add("out");
    r.add("over");
    r.add("p");
    r.add("part");
    r.add("parted");
    r.add("parting");
    r.add("parts");
    r.add("per");
    r.add("perhaps");
    r.add("place");
    r.add("places");
    r.add("point");
    r.add("pointed");
    r.add("pointing");
    r.add("points");
    r.add("possible");
    r.add("present");
    r.add("presented");
    r.add("presenting");
    r.add("presents");
    r.add("problem");
    r.add("problems");
    r.add("put");
    r.add("puts");
    r.add("q");
    r.add("quite");
    r.add("r");
    r.add("rather");
    r.add("really");
    r.add("right");
    r.add("room");
    r.add("rooms");
    r.add("s");
    r.add("said");
    r.add("same");
    r.add("saw");
    r.add("say");
    r.add("says");
    r.add("second");
    r.add("seconds");
    r.add("see");
    r.add("seem");
    r.add("seemed");
    r.add("seeming");
    r.add("seems");
    r.add("sees");
    r.add("several");
    r.add("shall");
    r.add("she");
    r.add("should");
    r.add("show");
    r.add("showed");
    r.add("showing");
    r.add("shows");
    r.add("side");
    r.add("sides");
    r.add("since");
    r.add("small");
    r.add("smaller");
    r.add("smallest");
    r.add("so");
    r.add("some");
    r.add("somebody");
    r.add("someone");
    r.add("something");
    r.add("somewhere");
    r.add("state");
    r.add("states");
    r.add("still");
    r.add("such");
    r.add("sure");
    r.add("t");
    r.add("take");
    r.add("taken");
    r.add("than");
    r.add("that");
    r.add("the");
    r.add("their");
    r.add("them");
    r.add("then");
    r.add("there");
    r.add("therefore");
    r.add("these");
    r.add("they");
    r.add("thing");
    r.add("things");
    r.add("think");
    r.add("thinks");
    r.add("this");
    r.add("those");
    r.add("though");
    r.add("thought");
    r.add("thoughts");
    r.add("three");
    r.add("through");
    r.add("thus");
    r.add("to");
    r.add("today");
    r.add("together");
    r.add("too");
    r.add("took");
    r.add("toward");
    r.add("turn");
    r.add("turned");
    r.add("turning");
    r.add("turns");
    r.add("two");
    r.add("u");
    r.add("under");
    r.add("until");
    r.add("up");
    r.add("upon");
    r.add("us");
    r.add("use");
    r.add("uses");
    r.add("used");
    r.add("v");
    r.add("very");
    r.add("w");
    r.add("want");
    r.add("wanted");
    r.add("wanting");
    r.add("wants");
    r.add("was");
    r.add("way");
    r.add("ways");
    r.add("we");
    r.add("well");
    r.add("wells");
    r.add("went");
    r.add("were");
    r.add("what");
    r.add("when");
    r.add("where");
    r.add("whether");
    r.add("which");
    r.add("while");
    r.add("who");
    r.add("whole");
    r.add("whose");
    r.add("why");
    r.add("will");
    r.add("with");
    r.add("within");
    r.add("without");
    r.add("work");
    r.add("worked");
    r.add("working");
    r.add("works");
    r.add("would");
    r.add("x");
    r.add("y");
    r.add("year");
    r.add("years");
    r.add("yet");
    r.add("you");
    r.add("young");
    r.add("younger");
    r.add("youngest");
    r.add("your");
    r.add("yours");
    r.add("z");
    return r;
};

module.exports = {
    getEnglishStoplist: _getEnglishStoplist
};


},{}],4:[function(require,module,exports){
function _getSpanishStoplist() {
    r = new Set();
    r.add("0");
    r.add("1");
    r.add("2");
    r.add("3");
    r.add("4");
    r.add("5");
    r.add("6");
    r.add("7");
    r.add("8");
    r.add("9");
    r.add("_");
    r.add("a");
    r.add("actualmente");
    r.add("acuerdo");
    r.add("adelante");
    r.add("ademas");
    r.add("además");
    r.add("adrede");
    r.add("afirmó");
    r.add("agregó");
    r.add("ahi");
    r.add("ahora");
    r.add("ahí");
    r.add("al");
    r.add("algo");
    r.add("alguna");
    r.add("algunas");
    r.add("alguno");
    r.add("algunos");
    r.add("algún");
    r.add("alli");
    r.add("allí");
    r.add("alrededor");
    r.add("ambos");
    r.add("ampleamos");
    r.add("antano");
    r.add("antaño");
    r.add("ante");
    r.add("anterior");
    r.add("antes");
    r.add("apenas");
    r.add("aproximadamente");
    r.add("aquel");
    r.add("aquella");
    r.add("aquellas");
    r.add("aquello");
    r.add("aquellos");
    r.add("aqui");
    r.add("aquél");
    r.add("aquélla");
    r.add("aquéllas");
    r.add("aquéllos");
    r.add("aquí");
    r.add("arriba");
    r.add("arribaabajo");
    r.add("aseguró");
    r.add("asi");
    r.add("así");
    r.add("atras");
    r.add("aun");
    r.add("aunque");
    r.add("ayer");
    r.add("añadió");
    r.add("aún");
    r.add("b");
    r.add("bajo");
    r.add("bastante");
    r.add("bien");
    r.add("breve");
    r.add("buen");
    r.add("buena");
    r.add("buenas");
    r.add("bueno");
    r.add("buenos");
    r.add("c");
    r.add("cada");
    r.add("casi");
    r.add("cerca");
    r.add("cierta");
    r.add("ciertas");
    r.add("cierto");
    r.add("ciertos");
    r.add("cinco");
    r.add("claro");
    r.add("comentó");
    r.add("como");
    r.add("con");
    r.add("conmigo");
    r.add("conocer");
    r.add("conseguimos");
    r.add("conseguir");
    r.add("considera");
    r.add("consideró");
    r.add("consigo");
    r.add("consigue");
    r.add("consiguen");
    r.add("consigues");
    r.add("contigo");
    r.add("contra");
    r.add("cosas");
    r.add("creo");
    r.add("cual");
    r.add("cuales");
    r.add("cualquier");
    r.add("cuando");
    r.add("cuanta");
    r.add("cuantas");
    r.add("cuanto");
    r.add("cuantos");
    r.add("cuatro");
    r.add("cuenta");
    r.add("cuál");
    r.add("cuáles");
    r.add("cuándo");
    r.add("cuánta");
    r.add("cuántas");
    r.add("cuánto");
    r.add("cuántos");
    r.add("cómo");
    r.add("d");
    r.add("da");
    r.add("dado");
    r.add("dan");
    r.add("dar");
    r.add("de");
    r.add("debajo");
    r.add("debe");
    r.add("deben");
    r.add("debido");
    r.add("decir");
    r.add("dejó");
    r.add("del");
    r.add("delante");
    r.add("demasiado");
    r.add("demás");
    r.add("dentro");
    r.add("deprisa");
    r.add("desde");
    r.add("despacio");
    r.add("despues");
    r.add("después");
    r.add("detras");
    r.add("detrás");
    r.add("dia");
    r.add("dias");
    r.add("dice");
    r.add("dicen");
    r.add("dicho");
    r.add("dieron");
    r.add("diferente");
    r.add("diferentes");
    r.add("dijeron");
    r.add("dijo");
    r.add("dio");
    r.add("donde");
    r.add("dos");
    r.add("durante");
    r.add("día");
    r.add("días");
    r.add("dónde");
    r.add("e");
    r.add("ejemplo");
    r.add("el");
    r.add("ella");
    r.add("ellas");
    r.add("ello");
    r.add("ellos");
    r.add("embargo");
    r.add("empleais");
    r.add("emplean");
    r.add("emplear");
    r.add("empleas");
    r.add("empleo");
    r.add("en");
    r.add("encima");
    r.add("encuentra");
    r.add("enfrente");
    r.add("enseguida");
    r.add("entonces");
    r.add("entre");
    r.add("era");
    r.add("erais");
    r.add("eramos");
    r.add("eran");
    r.add("eras");
    r.add("eres");
    r.add("es");
    r.add("esa");
    r.add("esas");
    r.add("ese");
    r.add("eso");
    r.add("esos");
    r.add("esta");
    r.add("estaba");
    r.add("estabais");
    r.add("estaban");
    r.add("estabas");
    r.add("estad");
    r.add("estada");
    r.add("estadas");
    r.add("estado");
    r.add("estados");
    r.add("estais");
    r.add("estamos");
    r.add("estan");
    r.add("estando");
    r.add("estar");
    r.add("estaremos");
    r.add("estará");
    r.add("estarán");
    r.add("estarás");
    r.add("estaré");
    r.add("estaréis");
    r.add("estaría");
    r.add("estaríais");
    r.add("estaríamos");
    r.add("estarían");
    r.add("estarías");
    r.add("estas");
    r.add("este");
    r.add("estemos");
    r.add("esto");
    r.add("estos");
    r.add("estoy");
    r.add("estuve");
    r.add("estuviera");
    r.add("estuvierais");
    r.add("estuvieran");
    r.add("estuvieras");
    r.add("estuvieron");
    r.add("estuviese");
    r.add("estuvieseis");
    r.add("estuviesen");
    r.add("estuvieses");
    r.add("estuvimos");
    r.add("estuviste");
    r.add("estuvisteis");
    r.add("estuviéramos");
    r.add("estuviésemos");
    r.add("estuvo");
    r.add("está");
    r.add("estábamos");
    r.add("estáis");
    r.add("están");
    r.add("estás");
    r.add("esté");
    r.add("estéis");
    r.add("estén");
    r.add("estés");
    r.add("ex");
    r.add("excepto");
    r.add("existe");
    r.add("existen");
    r.add("explicó");
    r.add("expresó");
    r.add("f");
    r.add("fin");
    r.add("final");
    r.add("fue");
    r.add("fuera");
    r.add("fuerais");
    r.add("fueran");
    r.add("fueras");
    r.add("fueron");
    r.add("fuese");
    r.add("fueseis");
    r.add("fuesen");
    r.add("fueses");
    r.add("fui");
    r.add("fuimos");
    r.add("fuiste");
    r.add("fuisteis");
    r.add("fuéramos");
    r.add("fuésemos");
    r.add("g");
    r.add("general");
    r.add("gran");
    r.add("grandes");
    r.add("gueno");
    r.add("h");
    r.add("ha");
    r.add("haber");
    r.add("habia");
    r.add("habida");
    r.add("habidas");
    r.add("habido");
    r.add("habidos");
    r.add("habiendo");
    r.add("habla");
    r.add("hablan");
    r.add("habremos");
    r.add("habrá");
    r.add("habrán");
    r.add("habrás");
    r.add("habré");
    r.add("habréis");
    r.add("habría");
    r.add("habríais");
    r.add("habríamos");
    r.add("habrían");
    r.add("habrías");
    r.add("habéis");
    r.add("había");
    r.add("habíais");
    r.add("habíamos");
    r.add("habían");
    r.add("habías");
    r.add("hace");
    r.add("haceis");
    r.add("hacemos");
    r.add("hacen");
    r.add("hacer");
    r.add("hacerlo");
    r.add("haces");
    r.add("hacia");
    r.add("haciendo");
    r.add("hago");
    r.add("han");
    r.add("has");
    r.add("hasta");
    r.add("hay");
    r.add("haya");
    r.add("hayamos");
    r.add("hayan");
    r.add("hayas");
    r.add("hayáis");
    r.add("he");
    r.add("hecho");
    r.add("hemos");
    r.add("hicieron");
    r.add("hizo");
    r.add("horas");
    r.add("hoy");
    r.add("hube");
    r.add("hubiera");
    r.add("hubierais");
    r.add("hubieran");
    r.add("hubieras");
    r.add("hubieron");
    r.add("hubiese");
    r.add("hubieseis");
    r.add("hubiesen");
    r.add("hubieses");
    r.add("hubimos");
    r.add("hubiste");
    r.add("hubisteis");
    r.add("hubiéramos");
    r.add("hubiésemos");
    r.add("hubo");
    r.add("i");
    r.add("igual");
    r.add("incluso");
    r.add("indicó");
    r.add("informo");
    r.add("informó");
    r.add("intenta");
    r.add("intentais");
    r.add("intentamos");
    r.add("intentan");
    r.add("intentar");
    r.add("intentas");
    r.add("intento");
    r.add("ir");
    r.add("j");
    r.add("junto");
    r.add("k");
    r.add("l");
    r.add("la");
    r.add("lado");
    r.add("largo");
    r.add("las");
    r.add("le");
    r.add("lejos");
    r.add("les");
    r.add("llegó");
    r.add("lleva");
    r.add("llevar");
    r.add("lo");
    r.add("los");
    r.add("luego");
    r.add("lugar");
    r.add("m");
    r.add("mal");
    r.add("manera");
    r.add("manifestó");
    r.add("mas");
    r.add("mayor");
    r.add("me");
    r.add("mediante");
    r.add("medio");
    r.add("mejor");
    r.add("mencionó");
    r.add("menos");
    r.add("menudo");
    r.add("mi");
    r.add("mia");
    r.add("mias");
    r.add("mientras");
    r.add("mio");
    r.add("mios");
    r.add("mis");
    r.add("misma");
    r.add("mismas");
    r.add("mismo");
    r.add("mismos");
    r.add("modo");
    r.add("momento");
    r.add("mucha");
    r.add("muchas");
    r.add("mucho");
    r.add("muchos");
    r.add("muy");
    r.add("más");
    r.add("mí");
    r.add("mía");
    r.add("mías");
    r.add("mío");
    r.add("míos");
    r.add("n");
    r.add("nada");
    r.add("nadie");
    r.add("ni");
    r.add("ninguna");
    r.add("ningunas");
    r.add("ninguno");
    r.add("ningunos");
    r.add("ningún");
    r.add("no");
    r.add("nos");
    r.add("nosotras");
    r.add("nosotros");
    r.add("nuestra");
    r.add("nuestras");
    r.add("nuestro");
    r.add("nuestros");
    r.add("nueva");
    r.add("nuevas");
    r.add("nuevo");
    r.add("nuevos");
    r.add("nunca");
    r.add("o");
    r.add("ocho");
    r.add("os");
    r.add("otra");
    r.add("otras");
    r.add("otro");
    r.add("otros");
    r.add("p");
    r.add("pais");
    r.add("para");
    r.add("parece");
    r.add("parte");
    r.add("partir");
    r.add("pasada");
    r.add("pasado");
    r.add("paìs");
    r.add("peor");
    r.add("pero");
    r.add("pesar");
    r.add("poca");
    r.add("pocas");
    r.add("poco");
    r.add("pocos");
    r.add("podeis");
    r.add("podemos");
    r.add("poder");
    r.add("podria");
    r.add("podriais");
    r.add("podriamos");
    r.add("podrian");
    r.add("podrias");
    r.add("podrá");
    r.add("podrán");
    r.add("podría");
    r.add("podrían");
    r.add("poner");
    r.add("por");
    r.add("por qué");
    r.add("porque");
    r.add("posible");
    r.add("primer");
    r.add("primera");
    r.add("primero");
    r.add("primeros");
    r.add("principalmente");
    r.add("pronto");
    r.add("propia");
    r.add("propias");
    r.add("propio");
    r.add("propios");
    r.add("proximo");
    r.add("próximo");
    r.add("próximos");
    r.add("pudo");
    r.add("pueda");
    r.add("puede");
    r.add("pueden");
    r.add("puedo");
    r.add("pues");
    r.add("q");
    r.add("qeu");
    r.add("que");
    r.add("quedó");
    r.add("queremos");
    r.add("quien");
    r.add("quienes");
    r.add("quiere");
    r.add("quiza");
    r.add("quizas");
    r.add("quizá");
    r.add("quizás");
    r.add("quién");
    r.add("quiénes");
    r.add("qué");
    r.add("r");
    r.add("raras");
    r.add("realizado");
    r.add("realizar");
    r.add("realizó");
    r.add("repente");
    r.add("respecto");
    r.add("s");
    r.add("sabe");
    r.add("sabeis");
    r.add("sabemos");
    r.add("saben");
    r.add("saber");
    r.add("sabes");
    r.add("sal");
    r.add("salvo");
    r.add("se");
    r.add("sea");
    r.add("seamos");
    r.add("sean");
    r.add("seas");
    r.add("segun");
    r.add("segunda");
    r.add("segundo");
    r.add("según");
    r.add("seis");
    r.add("ser");
    r.add("sera");
    r.add("seremos");
    r.add("será");
    r.add("serán");
    r.add("serás");
    r.add("seré");
    r.add("seréis");
    r.add("sería");
    r.add("seríais");
    r.add("seríamos");
    r.add("serían");
    r.add("serías");
    r.add("seáis");
    r.add("señaló");
    r.add("si");
    r.add("sido");
    r.add("siempre");
    r.add("siendo");
    r.add("siete");
    r.add("sigue");
    r.add("siguiente");
    r.add("sin");
    r.add("sino");
    r.add("sobre");
    r.add("sois");
    r.add("sola");
    r.add("solamente");
    r.add("solas");
    r.add("solo");
    r.add("solos");
    r.add("somos");
    r.add("son");
    r.add("soy");
    r.add("soyos");
    r.add("su");
    r.add("supuesto");
    r.add("sus");
    r.add("suya");
    r.add("suyas");
    r.add("suyo");
    r.add("suyos");
    r.add("sé");
    r.add("sí");
    r.add("sólo");
    r.add("t");
    r.add("tal");
    r.add("tambien");
    r.add("también");
    r.add("tampoco");
    r.add("tan");
    r.add("tanto");
    r.add("tarde");
    r.add("te");
    r.add("temprano");
    r.add("tendremos");
    r.add("tendrá");
    r.add("tendrán");
    r.add("tendrás");
    r.add("tendré");
    r.add("tendréis");
    r.add("tendría");
    r.add("tendríais");
    r.add("tendríamos");
    r.add("tendrían");
    r.add("tendrías");
    r.add("tened");
    r.add("teneis");
    r.add("tenemos");
    r.add("tener");
    r.add("tenga");
    r.add("tengamos");
    r.add("tengan");
    r.add("tengas");
    r.add("tengo");
    r.add("tengáis");
    r.add("tenida");
    r.add("tenidas");
    r.add("tenido");
    r.add("tenidos");
    r.add("teniendo");
    r.add("tenéis");
    r.add("tenía");
    r.add("teníais");
    r.add("teníamos");
    r.add("tenían");
    r.add("tenías");
    r.add("tercera");
    r.add("ti");
    r.add("tiempo");
    r.add("tiene");
    r.add("tienen");
    r.add("tienes");
    r.add("toda");
    r.add("todas");
    r.add("todavia");
    r.add("todavía");
    r.add("todo");
    r.add("todos");
    r.add("total");
    r.add("trabaja");
    r.add("trabajais");
    r.add("trabajamos");
    r.add("trabajan");
    r.add("trabajar");
    r.add("trabajas");
    r.add("trabajo");
    r.add("tras");
    r.add("trata");
    r.add("través");
    r.add("tres");
    r.add("tu");
    r.add("tus");
    r.add("tuve");
    r.add("tuviera");
    r.add("tuvierais");
    r.add("tuvieran");
    r.add("tuvieras");
    r.add("tuvieron");
    r.add("tuviese");
    r.add("tuvieseis");
    r.add("tuviesen");
    r.add("tuvieses");
    r.add("tuvimos");
    r.add("tuviste");
    r.add("tuvisteis");
    r.add("tuviéramos");
    r.add("tuviésemos");
    r.add("tuvo");
    r.add("tuya");
    r.add("tuyas");
    r.add("tuyo");
    r.add("tuyos");
    r.add("tú");
    r.add("u");
    r.add("ultimo");
    r.add("un");
    r.add("una");
    r.add("unas");
    r.add("uno");
    r.add("unos");
    r.add("usa");
    r.add("usais");
    r.add("usamos");
    r.add("usan");
    r.add("usar");
    r.add("usas");
    r.add("uso");
    r.add("usted");
    r.add("ustedes");
    r.add("v");
    r.add("va");
    r.add("vais");
    r.add("valor");
    r.add("vamos");
    r.add("van");
    r.add("varias");
    r.add("varios");
    r.add("vaya");
    r.add("veces");
    r.add("ver");
    r.add("verdad");
    r.add("verdadera");
    r.add("verdadero");
    r.add("vez");
    r.add("vosotras");
    r.add("vosotros");
    r.add("voy");
    r.add("vuestra");
    r.add("vuestras");
    r.add("vuestro");
    r.add("vuestros");
    r.add("w");
    r.add("x");
    r.add("y");
    r.add("ya");
    r.add("yo");
    r.add("z");
    r.add("él");
    r.add("éramos");
    r.add("ésa");
    r.add("ésas");
    r.add("ése");
    r.add("ésos");
    r.add("ésta");
    r.add("éstas");
    r.add("éste");
    r.add("éstos");
    r.add("última");
    r.add("últimas");
    r.add("último");
    r.add("últimos");
    return r;
};

module.exports = {
    getSpanishStoplist: _getSpanishStoplist
};


},{}],5:[function(require,module,exports){
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


},{"./en.js":3,"./es.js":4}]},{},[1]);
