define([ "require", "exports", "module", "jquery", "block-activity-filter", "block-search-box", "slippymap", "stamen-super-classy" ], function(require, exports, module, jquery, BlockActivityFilter, BlockSearchBox, Slippymap, StamenSuperClassy) {
    "use strict";
    function View(options) {
        function initMap() {
            $.getJSON(options.geojsonURI, function(r) {
                that.map = new Slippymap(".slippymap", {
                    data: r.response
                }, function() {
                    that.fire("map-initialized");
                });
            });
        }
        function init() {
            initMap(), that.blockSearchBox = new BlockSearchBox(".block-search-box", {}, function() {}), 
            that.blockActivityFilter = new BlockActivityFilter(".block-activity-filter", {}, function() {});
        }
        var that = this;
        StamenSuperClassy.apply(that, arguments), init();
    }
    module.exports = new View({
        geojsonURI: "/parks/search/yosemite.geojson?with=camping"
    });
});