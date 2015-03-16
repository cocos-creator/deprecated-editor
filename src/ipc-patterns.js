
var Ipc = require('ipc');
var nextSessionId = 0;
var replyCallbacks = {};

/**
 * @param {string} request - the request to send
 * @param {...*} [arg] - whatever arguments the request needs
 * @param {function} reply - the callback used to handle replied arguments
 */
Fire.sendRequestToCore = function (request) {
    'use strict';
    if (typeof request === 'string') {
        var args = [].slice.call(arguments, 1);
        var reply = args[args.length - 1];
        if (typeof reply === 'function') {
            args.pop();

            var sessionId = nextSessionId++;
            var key = "" + sessionId;
            replyCallbacks[key] = reply;

            Ipc.send('fire/sendReq2core', request, args, sessionId);
        }
        else {
            Fire.error('The reply must be of type function');
        }
    }
    else {
        Fire.error('The request must be of type string');
    }
};

Ipc.on('fire/sendReplyBack', function replyCallback (args, sessionId) {
    'use strict';
    var key = "" + sessionId;
    var cb = replyCallbacks[key];
    if (cb) {
        cb.apply(null, args);

        //if (sessionId + 1 === nextSessionId) {
        //    --nextSessionId;
        //}
        delete replyCallbacks[key];
    }
    else {
        Fire.error('non-exists callback of session:', sessionId);
    }
});
