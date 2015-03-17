
var Ipc = require('ipc');

// messages

/**
 * Send message to editor-core, which is so called as main app, or atom shell's browser side.
 * @param {string} message - the message to send
 * @param {...*} [arg] - whatever arguments the message needs
 */
Fire.sendToCore = function ( message ) {
    'use strict';
    if ( typeof message === 'string' ) {
        var args = [].slice.call( arguments );
        Ipc.send.apply( Ipc, ['send2core'].concat( args ) );
    }
    else {
        Fire.error('The message must be provided');
    }
};

/**
 * Broadcast message to all pages.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @param {string} message - the message to send
 * @param {...*} [arg] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options such as Fire.SelfExcluded
 */
Fire.sendToWindows = function ( message ) {
    'use strict';
    if ( typeof message === 'string' ) {
        var args = [].slice.call( arguments );
        Ipc.send.apply( Ipc, ['send2wins'].concat( args ) );
    }
    else {
        Fire.error('The message must be provided');
    }
};

/**
 * Broadcast message to main page.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @param {string} message - the message to send
 * @param {...*} [arg] - whatever arguments the message needs
 */
Fire.sendToMainWindow = function ( message ) {
    'use strict';
    if ( typeof message === 'string' ) {
        var args = [].slice.call( arguments );
        Ipc.send.apply( Ipc, ['send2mainwin'].concat( args ) );
    }
    else {
        Fire.error('The message must be provided');
    }
};

/**
 * Broadcast message to all pages and editor-core
 * @param {string} message - the message to send
 * @param {...*} [arg] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options such as Fire.SelfExcluded
 */
Fire.sendToAll = function ( message ) {
    'use strict';
    if ( typeof message === 'string' ) {
        var args = [].slice.call( arguments );
        Ipc.send.apply( Ipc, ['send2all'].concat( args ) );
    }
    else {
        Fire.error('The message must be provided');
    }
};

Fire.rpc = function ( name ) {
    'use strict';
    if ( typeof name === 'string' ) {
        var args = [].slice.call( arguments );
        Ipc.send.apply( Ipc, ['rpc'].concat( args ) );
    }
    else {
        Fire.error('The name of rpc must be provided');
    }
};


// Communication Patterns

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
