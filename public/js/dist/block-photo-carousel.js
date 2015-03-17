define([ "require", "exports", "module", "content-carousel", "stamen-super-classy", "content-fetcher" ], function(require, exports, module, ContentCarousel, StamenSuperClassy, ContentFetcher) {
    "use strict";
    module.exports = function(rootSelector) {
        function fetchPhotos() {
            contentFetcher.fetch();
        }
        function init() {
            var carouselSliderSelector = rootSelector + " .slide-container";
            that.carouselInstance = new ContentCarousel(rootSelector + " .slide-container", {
                slideClass: "coverphoto",
                snapToSlide: !0,
                showLoader: !0
            }), backButtonNode.addEventListener("click", function() {
                that.carouselInstance.goBackward();
            }, !1), forwardButtonNode.addEventListener("click", function() {
                that.carouselInstance.goForward();
            }, !1), that.utils.get(carouselSliderSelector)[0].addEventListener("scroll", function(e) {
                e.target.scrollWidth - e.target.scrollLeft < 4 * e.target.offsetWidth && fetchPhotos();
            }, !1), that.carouselInstance.on("forward", function(e) {
                e.caller.target.scrollLeft > e.caller.target.scrollWidth - (e.caller.target.offsetWidth + e.caller.target.offsetWidth / 2) ? rootNode.parentNode.parentNode.classList.add("scrolled-furthest") : rootNode.parentNode.parentNode.classList.remove("scrolled-furthest"), 
                e.caller.target.scrollLeft < e.caller.target.offsetWidth / 2 ? rootNode.parentNode.parentNode.classList.add("not-scrolled") : rootNode.parentNode.parentNode.classList.remove("not-scrolled");
            }), that.carouselInstance.on("backward", function(e) {
                e.caller.target.scrollLeft > e.caller.target.scrollWidth - (e.caller.target.offsetWidth + e.caller.target.offsetWidth / 2) ? rootNode.parentNode.parentNode.classList.add("scrolled-furthest") : rootNode.parentNode.parentNode.classList.remove("scrolled-furthest"), 
                e.caller.target.scrollLeft < e.caller.target.offsetWidth / 2 ? rootNode.parentNode.parentNode.classList.add("not-scrolled") : rootNode.parentNode.parentNode.classList.remove("not-scrolled");
            }), rootNode.addEventListener("click", function(e) {
                var titleLink = e.target.querySelector(".title-link") || that.utils.parentHasClass(e.target, "title-link"), edgeBuffer = 55, middle = [ e.target.offsetLeft - e.target.parentNode.offsetLeft + edgeBuffer, e.target.offsetLeft - e.target.parentNode.offsetLeft + e.target.offsetWidth - edgeBuffer ];
                (e.pageX >= middle[0] && e.pageX <= middle[1] || e.target.classList.contains("attribution")) && (e.preventDefault(), 
                location.href = titleLink.getAttribute("href"));
            }, !1), contentFetcher = new ContentFetcher(slideContainerNode, "flickr_coverphoto", location.href + "/flickr.json", "response.flickr.items", {
                startat: 5,
                incrementArg: "startat",
                srcArguments: {
                    startat: 5,
                    limit: 20
                }
            });
        }
        var contentFetcher, that = this, backButtonSelector = ".carousel-back-button", forwardButtonSelector = ".carousel-forward-button";
        StamenSuperClassy.apply(this, arguments);
        var rootNode = that.utils.get(rootSelector)[0], backButtonNode = that.utils.get(backButtonSelector, rootNode)[0], forwardButtonNode = that.utils.get(forwardButtonSelector, rootNode)[0], slideContainerNode = that.utils.get(".slide-container", rootNode)[0];
        return rootNode ? (init(), that) : null;
    };
});