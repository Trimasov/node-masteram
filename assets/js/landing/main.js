jQuery(document).ready(function() {
    if (typeof jQuery.fn.bxSlider !== 'undefined') {
        jQuery('.home-slider .bxslider').bxSlider({
            auto: true,
            mode: 'vertical',
            caption: true,
            pager: true
        });

        jQuery('.fullpage_layout  .screenshot-slider').bxSlider({
            slideWidth: 300,
            minSlides: 1,
            maxSlides: 1,
            auto: true,
            controls:true,
            nextText: '<i class="fa fa-angle-right"></i>',
            prevText: '<i class="fa fa-angle-left"></i>'
        });

        jQuery('.onepage_layout  .screenshot-slider').bxSlider({
            slideWidth: 300,
            minSlides: 1,
            maxSlides: 4,
            auto: true,
        });

        jQuery('.onepage_layout  .reviews-slider').bxSlider({
            slideWidth: 1070,
            minSlides: 1,
            maxSlides: 1,
            auto: true,
            slideMargin: 40,
            caption: true,
            nextText: '<i class="fa fa-angle-right"></i>',
            prevText: '<i class="fa fa-angle-left"></i>'
        });

        jQuery('.fullpage_layout .reviews-slider').bxSlider({
            slideWidth: 500,
            minSlides: 1,
            maxSlides: 1,
            auto: true,
            caption: true,
            nextText: '<i class="fa fa-angle-right"></i>',
            prevText: '<i class="fa fa-angle-left"></i>'
        });
    }

    // toggle js
    jQuery('.onepage_layout .main-navigation .menu-toggle').click(function() {
        jQuery('.main-navigation .menu').slideToggle('slow');
    });
    jQuery('.main-navigation .menu-item-has-children').append('<span class="menu-item"> <i class="fa fa-angle-down"></i> </span>');

    jQuery('.main-navigation .menu-item').click(function() {
        jQuery(this).parent('.menu-item-has-children').children('ul.sub-menu').first().slideToggle('1000');
        jQuery(this).children('.fa-angle-right').first().toggleClass('fa-angle-right');
    });

    // add active class for onepage menu js
    if (typeof jQuery.fn.fullpage == 'undefined') {
        var nav = jQuery('#masthead'),
            menu_height = nav.outerHeight();

        jQuery('#nav li').on('click', function() {
            var scrollAnchor = jQuery(this).find('a').attr('href').replace(/\#*/g, ""),
                scrollPoint = jQuery('div[id="' + scrollAnchor + '"]').offset().top - menu_height;
            jQuery('body,html').animate({
                scrollTop: scrollPoint
            }, 500);

            return false;

        });

        var sections = jQuery('div.tg-fullpage-section');

        jQuery(window).on('scroll', function() {
            var cur_pos = jQuery(this).scrollTop();
            //console.log(cur_pos);

            sections.each(function() {
                var top = jQuery(this).offset().top - menu_height,
                    bottom = top + jQuery(this).outerHeight();
                //console.log('height is' +top );
                if (cur_pos >= top && cur_pos <= bottom) {
                    nav.find('li').removeClass('active');

                    nav.find('li a[href="#' + jQuery(this).attr('data-anchor') + '"]').parent('li').addClass('active');
                }
            });
        });
    }

    // Init WOW.js
    if (typeof WOW == 'function') {
        new WOW().init();
    }

    // add active class in menu while scroll for fullpge js
    if (typeof jQuery.fn.fullpage !== 'undefined') {
        jQuery(document).ready(function() {
            jQuery.noConflict();
            jQuery('#nav li').filter(function() {
                jQuery(this).attr('data-menuanchor', this.children[0].hash.replace(/\#*/g, ""));
            });
            var fullpageAnchors = [];
            jQuery('#nav li').each(function() {
                fullpageAnchors.push(jQuery(this).find('a').attr('href').replace(/\#*/g, ""));
            });

            jQuery('#fullpage').fullpage({
                anchors: fullpageAnchors,
                menu: '#nav',
                //Custom selectors
                sectionSelector: '.tg-fullpage-section'
            });
        });
    }

    // make header sticky for onepage js
    if(jQuery('html').hasClass('mobile') || jQuery('html').hasClass('tablet')){
			if (typeof jQuery.fn.sticky !== 'undefined') {
					var wpAdminBar = jQuery('.onepage_layout #wpadminbar');
					if (wpAdminBar.length) {
							jQuery(".onepage_layout #masthead").sticky({ topSpacing: wpAdminBar.height() });
					} else {
							jQuery(".onepage_layout #masthead").sticky({ topSpacing: 0 });
					}
			}
		}

    // js to scroll button to pop
    jQuery("#scroll-up").hide();

    jQuery(window).scroll(function() {
        if (jQuery(this).scrollTop() > 1000) {
            jQuery('#scroll-up').fadeIn();
        } else {
            jQuery('#scroll-up').fadeOut();
        }
    });
    jQuery('a#scroll-up').click(function() {
        jQuery('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });


    //menu toggle
    jQuery(window).on('load', function() {

        var width = Math.max(window.innerWidth, document.documentElement.clientWidth);

        if (width && width <= 1019) {

            jQuery('.fullpage_layout .menu-toggle,.fullpage_layout #site-navigation ul li a').click(function() {
                jQuery('.fullpage_layout .tg-menu-wrapper').toggleClass('fullpage-menu-active');
            });
        }
    });

});
