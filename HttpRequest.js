var http = require('http');
var debug = require('debug');
var _ = require('lodash');
var log4js = require('log4js');

function HttpRequest() {
    this._debug = debug('HttpRequest');
    this._logger = log4js.getLogger('HttpRequest');
}

var p = HttpRequest.prototype;

p.sendRequest = function(options, requestData, cb, timeoutCallback) {
    this._debug('_sendRequest');

    var req = http.request(options);
    this.request = req;
    req.on('response', _.bind(this._onResponse, this, cb, requestData));
    req.on('error', _.bind(this._onRequestError, this, cb, requestData));
    
    if (options.timeout) {
        req.setTimeout(options.timeout, _.bind(this._onRequestTimeout, this, req, cb, timeoutCallback));
    }
    
    req.end(requestData);
};

p._onRequestTimeout = function(req, cb, timeoutCallback) {
    this._debug('_onRequestTimeout');
    
    var errMsg = 'Request timed out after ' + options.timeout;
    this._logger.warn(errMsg);
    
    if (timeoutCallback && _.isFunction(timeoutCallback)) {
        timeoutCallback(new Error('Request timed out'), req);
    } else {
        req.abort(); // raising _onRequestError
    }
};

p._onRequestError = function(cb, requestData, err) {
    this._debug('_onRequestError');

    this._logger.warn('Error getting data from server: ' + err.toString());
    cb(err);
};

p._onResponse = function(cb, requestData, res) {
    this._debug('_onResponse');
    
    if (res.statusCode !== 200) {
        var errorMessage = 'Got bad status code from server: ' + res.statusCode;
        this._logger.warn(errorMessage);
        cb(new Error(errorMessage));
        return;
    }
    var body = [];
    res.on('readable', _.bind(this._onReadable, this, res, body));
    res.on('end', _.bind(this._onSendRequestDone, this, cb, res, body));
};

p._onReadable = function(res, body) {
    this._debug('_onReadable');
    for (;;) {
        var chunk = res.read();
        if (chunk === null) {
            return;
        }
        body.push(chunk);
    }
};

p._onSendRequestDone = function(cb, res, body) {
    this._debug('_onSendRequestDone', body);
	res.body = body;
    cb(null, res, body);
};

module.exports = HttpRequest;
