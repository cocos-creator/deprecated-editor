(function () {
    function _getUserHome() {
        return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    }

    Polymer({
        ready: function () {
            this.$.name.value = "New Project";
            this.$.path.value = _getUserHome();
        },
    });
})();
