// 解析加载进来的 bundle 的 source map
var Fs = require('fire-fs');
var SourceMapConsumer = require('source-map').SourceMapConsumer;


var HEAD = '//# sourceMappingURL=data:application/json;base64,';
var INDENT = '&nbsp;&nbsp;&nbsp;&nbsp;';
var COMPILED_LINE_OFFSET = -3;   // 扣除 pre compile 时加上的行数

function getLastLine (text) {
    var begin = text.lastIndexOf('\n');
    if (begin === -1) {
        return text.trim();
    }
    var lastLine = text.substring(begin).trim();
    if (! lastLine) {
        // skip empty line
        begin = text.lastIndexOf('\n', begin - 1);
        //if (begin === -1) {
        //    begin = 0;
        //}
        lastLine = text.substring(begin).trim();
    }
    return lastLine;
}

function decodeBase64 (base64) {
    return window.atob(base64);
}

function resolveSourceUrl (oriPos) {
    // ../../../dev/builtin/src/audio-source.js
    // ../../../dev/bin/node_modules/browserify/node_modules/browser-pack/_prelude.js
    // ../../../dev/assets/script/GameOverMenu.js
    var HEAD_MAC = '../../../dev/';
    var HEAD_WIN = '..\\..\\..\\dev\\';
    var HEAD_LEN = HEAD_MAC.length;
    var url = oriPos.source;
    if (url.indexOf(HEAD_MAC) === 0 || url.indexOf(HEAD_WIN) === 0) {
        if (url.indexOf('assets', HEAD_LEN) === HEAD_LEN) {
            oriPos.source = url.substring(HEAD_LEN + 6 + 1);
            oriPos.line = oriPos.line + COMPILED_LINE_OFFSET;
        }
        else if (url.indexOf('bin', HEAD_LEN) === HEAD_LEN) {
            oriPos.source = 'fire://' + url.substring(HEAD_LEN);
        }
        else if (url.indexOf('builtin', HEAD_LEN) === HEAD_LEN) {
            oriPos.source = 'fire://builtin/*/' + url.substring(HEAD_LEN + 7 + 1);
            oriPos.line = oriPos.line + COMPILED_LINE_OFFSET;
        }
        // TODO: global
    }
}

var srcMaps = {};   // { %bundle-url%: { smc: SourceMapConsumer, urlToLines: { %src-url%: sourceLine[] } } }

var SourceMap = {

    loadSrcMap: function (path, url, callback) {
        Fs.readFile(path, function (err, data) {

            // parse source

            if (err) {
                Fire.error('Failed to load source map from %s, %s', path, err);
                return callback();
            }
            var source = data.toString();
            var lastLine = getLastLine(source);
            if (! lastLine) {
                Fire.warn('Failed to load source map from %s, file is empty.', path);
                return callback();
            }
            if (lastLine.substring(0, HEAD.length) !== HEAD) {
                Fire.error('Failed to load source map from %s, unknown syntax.', path);
                return callback();
            }
            var base64 = lastLine.substring(HEAD.length);
            var rawSourceMapJson = decodeBase64(base64);
            if (! rawSourceMapJson) {
                Fire.error('Failed to load source map from %s, can not decode from base64.', path);
                return callback();
            }
            var rawSourceMap = null;
            try {
                rawSourceMap = JSON.parse(rawSourceMapJson);
            }
            catch (e) {
                Fire.error('Failed to load source map from %s, %s', path, e);
                return callback();
            }

            // 自己缓存源码
            var sourcesContent = rawSourceMap.sourcesContent;
            rawSourceMap.sourcesContent = undefined;

            // create consumer

            var smc = null;
            try {
                smc = new SourceMapConsumer(rawSourceMap);
            }
            catch (e) {
                Fire.error('Failed to load source map from %s, %s', path, e);
                return callback();
            }

            var urlToLines = {};
            for (var i = 0; i < sourcesContent.length; i++) {
                var content = sourcesContent[i];
                var sourceLines = content.split('\n').map(function (x) {
                    return x.trim();
                });
                var oriUrl = rawSourceMap.sources[i];
                urlToLines[oriUrl] = sourceLines;
            }
            srcMaps[url] = {
                smc: smc,
                urlToLines: urlToLines,
            };

            callback();
        });
    },

    //originalPositionFor: function () {
    //
    //},

    resolveStack: function (stack) {
        // before:
        //TypeError: Cannot read property 'a' of null
        //at Fire.Class.onStart (library://bundle.project.js?1:390:7)
        //at callOnStartInTryCatch (fire://src/engine/engine.js:1981:15)
        // ...
        // after:
        //TypeError: Cannot read property 'a' of null
        //at Fire.Class.onStart (NewComponent.js:26)

        var srcPrinted = false;

        var lines = stack.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var stackLine = lines[i];
            // if '    at ****)'
            if (stackLine.indexOf('    at ') === 0 && stackLine.charCodeAt(stackLine.length - 1) === 41) {
                var infoEnd = stackLine.lastIndexOf(' (');
                if (infoEnd === -1) {
                    continue;
                }
                // library://bundle.project.js?1:390:7
                var position = stackLine.substring(infoEnd + 2, stackLine.length - 1);
                // get column
                var index = position.lastIndexOf(':');
                if (index === -1) {
                    continue;
                }
                var columnStr = position.substring(index + 1);
                var column = parseInt(columnStr);
                if (isNaN(column)) {
                    continue;
                }
                // get line
                index = position.lastIndexOf(':', index - 1);
                if (index === -1) {
                    continue;
                }
                var lineStr = position.substring(index + 1);
                var line = parseInt(lineStr);
                if (isNaN(line)) {
                    continue;
                }
                // get url
                var queryBegin = position.lastIndexOf('?', index - 1);
                index = queryBegin !== -1 ? queryBegin : index;
                var url = position.substring(0, index);
                //console.log('info "%s", url "%s", line "%s", col "%s"', stackLine.substring(0, infoEnd + 2), url, line, column);
                //continue;

                var sourceMap = srcMaps[url];
                if (sourceMap) {
                    var smc = sourceMap.smc;
                    var oriPos = smc.originalPositionFor({
                        line: line,
                        column: column
                    });
                    var oriSource = oriPos.source;
                    var oriLine = oriPos.line;
                    if (oriSource) {
                        resolveSourceUrl(oriPos);
                        var info;
                        if (srcPrinted) {
                            info = stackLine.substring(0, infoEnd + 2);
                        }
                        else {
                            var sourceLines = sourceMap.urlToLines[oriSource];
                            if (sourceLines) {
                                var lineIndex = oriLine - 1;    // oriLine start from 1
                                info = stackLine.substring(0, infoEnd) + ': "' + sourceLines[lineIndex] + '" (';
                                srcPrinted = true;
                            }
                            else {
                                info = stackLine.substring(0, infoEnd + 2);
                            }
                        }
                        if (oriPos.column) {
                            lines[i] = INDENT + info + oriPos.source + ':' + oriPos.line + ':' + oriPos.column + ')';
                        }
                        else {
                            lines[i] = INDENT + info + oriPos.source + ':' + oriPos.line + ')';
                        }
                        continue;
                    }
                }
                lines[i] = INDENT + lines[i];
            }
        } // end for
        return lines.join('\n');
    }
};
Fire._SourceMap = SourceMap;
