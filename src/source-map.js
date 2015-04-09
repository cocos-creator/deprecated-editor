// 解析加载进来的 bundle 的 source map，并以此美化堆栈输出

var Fs = require('fire-fs');
var Path = require('fire-path');
var SourceMapConsumer = require('source-map').SourceMapConsumer;

var COMPILED_LINE_OFFSET = -3;   // 扣除 pre compile 时加上的行数

var INDENT = '    ';

// 最后一个以这个命名结尾的方法，及之后的调用堆栈会隐藏不显示。
var IGNORE_CALL_SUFFIX = 'InTryCatch';

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

function resolveSourceUrls (rawSourceMap, sources) {
    var srcUrls = rawSourceMap.sources;
    console.log('resolving: ' + srcUrls);

    // 不知道为什么开发版里 browserify 生成的 sources 含有 repo 所在的 dev 目录，只好这里去除
    var Remote = require('remote');
    var root = Remote.getGlobal('FIRE_PATH');
    root = Path.resolve(root, '../');
    var stripPrefix = Path.basename(root);

    for (var i = 0; i < srcUrls.length; i++) {
        var src = srcUrls[i];
        // remove '../'
        src = src.replace(/\.\.\//g, '');
        src = src.replace(/\.\.\\/g, '');
        // remove 'dev'
        if (src.indexOf(stripPrefix) === 0) {
            src = src.substring(stripPrefix.length + 1);
        }
        //
        var lineOffset = 0;
        if (src.indexOf('assets') === 0) {
            src = src.substring('assets'.length + 1);
            lineOffset = COMPILED_LINE_OFFSET;
        }
        else if (src.indexOf('builtin') === 0) {
            src = 'fire://builtin/*/' + src.substring('builtin'.length + 1);
            lineOffset = COMPILED_LINE_OFFSET;
        }
        else if (src.indexOf('bin') === 0) {
            src = 'fire://' + src.substring('bin'.length + 1);
        }
        else if (src.indexOf('app') === 0) {
            src = 'fire://' + src.substring('app'.length + 1);
        }
        // TODO: global

        srcUrls[i] = src;
        sources[src] = {
            lineOffset: lineOffset
        };
    }
}

//  %bundle-url%: {
//      smc: SourceMapConsumer,
//      sources: {
//          %src-url%: {
//              lines: sourceLine[],
//              lineOffset: lineOffset
//          }
//      }
//  }
var srcMaps = {};

var SourceMap = {

    _srcMaps: srcMaps,

    loadFromSourceComment: function (source) {
        var HEAD = '//# sourceMappingURL=data:application/json;base64,';

        var lastLine = getLastLine(source);
        if (! lastLine) {
            throw 'file is empty';
        }
        if (lastLine.substring(0, HEAD.length) !== HEAD) {
            throw 'unknown syntax';
        }
        var base64 = lastLine.substring(HEAD.length);
        var json = decodeBase64(base64);
        if (! json) {
            throw 'can not decode from base64';
        }
        return JSON.parse(json);
    },

    loadFromFileComment: function (path, callback) {
        Fs.readFile(path, function (err, data) {
            if (err) {
                //Fire.error('Failed to load source map from %s, %s', path, err);
                //return callback(err);
                // 可能是项目里没有脚本
                return callback();
            }
            var source = data.toString();
            var result;
            try {
                result = SourceMap.loadFromSourceComment(source);
            }
            catch (e) {
                // Fire.error('Failed to load source map from %s, %s.', path, e.stack);
                // return callback(e);
                return callback(e);
            }
            callback(null, result);
        });
    },

    loadSrcMap: function (path, url, callback) {
        this.loadFromFileComment(path, function (err, rawSourceMap) {
            if (err) {
                return callback();
            }

            // 自己缓存源码
            var sourcesContent = rawSourceMap.sourcesContent;
            rawSourceMap.sourcesContent = undefined;

            // 修正源文件 url
            var sources = {};
            resolveSourceUrls(rawSourceMap, sources);

            // create consumer

            var smc = null;
            try {
                smc = new SourceMapConsumer(rawSourceMap);
            }
            catch (e) {
                Fire.error('Failed to load source map from %s, %s', path, e);
                return callback();
            }

            for (var i = 0; i < sourcesContent.length; i++) {
                var content = sourcesContent[i];
                var sourceLines = content.split('\n').map(function (x) {
                    return x.trim();
                });
                var oriUrl = rawSourceMap.sources[i];
                sources[oriUrl].lines = sourceLines;
            }
            srcMaps[url] = {
                smc: smc,
                sources: sources,
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
        //    at Fire.Class.onStart (library://bundle.project.js?1:390:7)
        //    at callOnStartInTryCatch (fire://src/engine/engine.js:1981:15)
        // ...
        // after:
        //TypeError: Cannot read property 'a' of null
        //    at Fire.Class.onStart (NewComponent.js:26)

        var PREFIX = '    at ';
        var SUFFIX_CODE = ')'.charCodeAt(0);

        var lines = stack.split('\n');

        var srcPrinted = false;
        var i, stackLine;

        // strip engine internal call stacks
        for (i = lines.length - 1; i >= 0; i--) {
            stackLine = lines[i];
            // if '    at ****)'
            if (stackLine.indexOf(PREFIX) === 0 && stackLine.charCodeAt(stackLine.length - 1) === SUFFIX_CODE) {
                var funcNameEnd = stackLine.indexOf(' ', PREFIX.length);
                var suffixStart = funcNameEnd - IGNORE_CALL_SUFFIX.length;
                var ignoreFuncName = stackLine.lastIndexOf(IGNORE_CALL_SUFFIX, funcNameEnd - 1) === suffixStart;
                if (ignoreFuncName) {
                    lines.length = i;   // strip lines
                    break;
                }
            }
        }
        //

        for (i = 0; i < lines.length; i++) {
            stackLine = lines[i];
            // if '    at ****)'
            if (stackLine.indexOf(PREFIX) === 0 && stackLine.charCodeAt(stackLine.length - 1) === SUFFIX_CODE) {
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
                    var srcUrl = oriPos.source;
                    if (srcUrl) {
                        var sources = sourceMap.sources[srcUrl];
                        var info;
                        if (srcPrinted) {
                            info = stackLine.substring(0, infoEnd + 2);
                        }
                        else {
                            var lineIndex = oriPos.line - 1;    // start from 1
                            info = stackLine.substring(0, infoEnd) + ': "' + sources.lines[lineIndex] + '" (';
                            srcPrinted = true;
                        }
                        var srcLineIndex = oriPos.line + sources.lineOffset;
                        if (oriPos.column) {
                            lines[i] = INDENT + info + srcUrl + ':' + srcLineIndex + ':' + oriPos.column + ')';
                        }
                        else {
                            lines[i] = INDENT + info + srcUrl + ':' + srcLineIndex + ')';
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
Editor._SourceMap = SourceMap;
