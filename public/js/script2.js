(function () {
//    'use strict';
    this.PlayerAPI = function() {
        this._class = arguments.callee;
        this._class.createInstanceMethods.call(this);
    };
    PlayerAPI.createInstanceMethods = function () {
        // api methods go here
    };
}());
