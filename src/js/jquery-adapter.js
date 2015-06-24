(function ($) {
    var PSWP_TPL = [
            '<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">',
                // <!-- Background of PhotoSwipe.
                //     It's a separate element as animating opacity is faster than rgba(). -->
                '<div class="pswp__bg"></div>',

                // <!-- Slides wrapper with overflow:hidden. -->
                '<div class="pswp__scroll-wrap">',

                    // <!-- Container that holds slides.
                    //    PhotoSwipe keeps only 3 of them in the DOM to save memory.
                    //    Don't modify these 3 pswp__item elements, data is added later on. -->
                    '<div class="pswp__container">',
                        '<div class="pswp__item"></div>',
                        '<div class="pswp__item"></div>',
                        '<div class="pswp__item"></div>',
                    '</div>',

                    // <!-- Default (PhotoSwipeUI_Default) interface on top of sliding area. Can be changed. -->
                    '<div class="pswp__ui pswp__ui--hidden">',

                        '<div class="pswp__top-bar">',

                            // <!--  Controls are self-explanatory. Order can be changed. -->

                            '<div class="pswp__counter"></div>',

                            '<button class="pswp__button pswp__button--close" title="Kapat (Esc)"></button>',

                            '<button class="pswp__button pswp__button--share" title="Paylaş"></button>',

                            '<button class="pswp__button pswp__button--fs" title="Tam ekran görünümünü aç/kapat"></button>',

                            '<button class="pswp__button pswp__button--zoom" title="Büyült/Küçült"></button>',

                            // <!-- Preloader demo http://codepen.io/dimsemenov/pen/yyBWoR -->
                            // <!-- element will get class pswp__preloader--active when preloader is running -->
                            '<div class="pswp__preloader">',
                                '<div class="pswp__preloader__icn">',
                                    '<div class="pswp__preloader__cut">',
                                        '<div class="pswp__preloader__donut"></div>',
                                    '</div>',
                                '</div>',
                            '</div>',
                        '</div>',

                        '<div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">',
                            '<div class="pswp__share-tooltip"></div>',
                        '</div>',

                        '<button class="pswp__button pswp__button--arrow--left" title="Önceki (sol ok)"></button>',

                        '<button class="pswp__button pswp__button--arrow--right" title="Sonraki (sağ ok)"></button>',

                        '<div class="pswp__caption">',
                            '<div class="pswp__caption__center"></div>',
                        '</div>',

                    '</div>',
                '</div>',
            '</div>'
        ].join(""),

        DEFAULTS = {
            errorMsg : '<div class="pswp__error-msg"><a href="%url%" target="_blank">Görsel</a> yüklenemedi.</div>',
            shareEl : false,
            bgOpacity : .95
        },

        SELECTOR_EL = '[data-role="photoswipe"]',
        GROUPS = {},
        elIndex = 0,
        pswpEl;

    // Parse picture index and gallery index from URL (#&pid=1&gid=2)
    function parseHash () {
        var hash = window.location.hash.substring(1),
            params = {},
            i = -1,
            vars, len, item, pair;

        if (hash.length > 4) {
            len = (vars = hash.split("&")).length;

            while (++i < len) {
                if (!!(item = vars[i]) && (pair = item.split("=")).length > 1) {
                    params[pair[0]] = pair[1];
                }
            }

            if (params.hasOwnProperty("gid")) {
                params.gid = parseInt(params.gid, 10);
            }

            if (params.hasOwnProperty("pid")) {
                params.pid = parseInt(params.pid, 10);
            }
        }

        return params;
    };

    function buildItemsArray (elements) {
        var len = elements.length,
            i = -1,
            items = [],
            $a, $img, size, itemCfg, width, height;

        while (++i < len) {
            $a = elements[i];
            size = ($a.data("size") || "").toString().split("x");
            itemCfg = {
                src : $a.attr("href"),
                msrc : $a.data("msrc") || $a.find("img").attr("src")
            };

            if (size.length === 2) {
                width = parseInt(size[0], 10);
                height = parseInt(size[1], 10);

                if (!isNaN(width) && !isNaN(height)) {
                    itemCfg.w = width;
                    itemCfg.h = height;
                }
            }

            items.push(itemCfg);
        }

        return items;
    }

    function getGroupByUId (groupUId) {
        var group, groupName;

        for (groupName in GROUPS) {
            if (
                GROUPS.hasOwnProperty(groupName) &&
                (group = GROUPS[groupName]).uId === groupUId
            ) {
                return group;
            }
        }

        throw "Group with uId {0} does not exist.".format(groupUId);
    }

    function getItemIndex (group, elId) {
        var items = group.items,
            i = -1,
            len = items.length;

        while (++i < len) {
            if (items[i].data("el-id") === elId) {
                return i;
            }
        }

        throw "Element with id {0} not found in group with id {1}".format(elId, group.uId);
    }

    function createThumbBoundsGetterFn (items) {
        return function (index) {
            var $a = items[index],
                $thumbnail = $a.find("img"),
                rect = ($thumbnail.length > 0 ? $thumbnail : $a)[0].getBoundingClientRect();

            return {
                x : rect.left,
                y : rect.top + (window.pageYOffset || document.documentElement.scrollTop),
                w : rect.width
            };
        };
    }

    function openGallery (group, itemIndex, disableAnimation) {
        var items = group.items,
            options = $.extend(true, {}, DEFAULTS, {
                    index : itemIndex,
                    galleryUID : group.uId,
                    getThumbBoundsFn : createThumbBoundsGetterFn(items)
                }
            );

        if (disableAnimation === true) {
            options.showAnimationDuration = 0;
        }

        new PhotoSwipe(
            pswpEl,
            PhotoSwipeUI_Default,
            buildItemsArray(items),
            options
        ).init();
    }

    $(function () {
        var $photoswipeableEls = $(SELECTOR_EL),
            groupUId = 0,
            $el, group, groupName, hashData;

        // init
        $photoswipeableEls.each(function () {
            $el = $(this);
            groupName = $el.data("groupName") || "default";

            if (!GROUPS.hasOwnProperty(groupName)) {
                GROUPS[groupName] = {
                    uId : ++groupUId,
                    items : []
                };
            }

            GROUPS[groupName].items.push(
                $el.data({
                    "pswp-uid" : groupUId,
                    "el-id" : ++elIndex
                })
            );
        });

        if ($photoswipeableEls.length > 0) {
            pswpEl = $(PSWP_TPL).appendTo("body")[0];

            $(document.body).on("click", SELECTOR_EL, function (e) {
                e.preventDefault();
                group = getGroupByUId(
                    ($el = $(e.currentTarget)).data("pswp-uid")
                );
                openGallery(group, getItemIndex(group, $el.data("el-id")));
            });

            // Parse URL and open gallery if it contains #&pid=3&gid=1
            hashData = parseHash();

            if (hashData.pid > 0 && hashData.gid > 0) {
                openGallery(
                    getGroupByUId(hashData.gid),
                    hashData.pid - 1,
                    true
                );
            }
        }
    });
})(jQuery);