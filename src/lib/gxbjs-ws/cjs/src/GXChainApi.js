"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GXChainApi = function () {
    function GXChainApi(ws_rpc, api_name) {
        _classCallCheck(this, GXChainApi);

        this.ws_rpc = ws_rpc;
        this.api_name = api_name;
    }

    GXChainApi.prototype.init = function init() {
        var self = this;
        return this.ws_rpc.call([1, this.api_name, []]).then(function (response) {
            //console.log("[GXChainApi.js:11] ----- GXChainApi.init ----->", this.api_name, response);
            self.api_id = response;
            return self;
        });
    };

    GXChainApi.prototype.exec = function exec(method, params) {
        return this.ws_rpc.call([this.api_id, method, params]).catch(function (error) {
            // console.log("!!! GXChainApi error: ", method, params, error, JSON.stringify(error));
            throw error;
        });
    };

    return GXChainApi;
}();

exports.default = GXChainApi;
module.exports = exports["default"];