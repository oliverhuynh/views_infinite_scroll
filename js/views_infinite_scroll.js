var VIS = VIS || {};
(function ($, VIS) {

  /**
   * Attach infinite scroll to the relevant views.
   * Autopage will override anything in script tags
   * For the sake of javascript overwriting global variables
   */
  VIS.VFI = VIS.VFI || {
    attach: function (context, settings) {
      if (this.ran) {
        return;
      }
      this.ran = true;
      settings = settings || Drupal.settings;
      if (!settings.views_infinite_scroll) {
        return ;
      }

      // Make sure that autopager plugin is loaded.
      if (!$.autopager) {
        alert(Drupal.t('Autopager jQuery plugin is not loaded.'));
        return;
      }

      var settings = settings.views_infinite_scroll[0];
      // Fix the multi
      if (settings.content_selector.substring(0,1) != '>') {
        settings.content_selector = '> ' + settings.content_selector;
      }
      if (settings.pager_selector.substring(0,1) != '>') {
        settings.pager_selector = '> div.item-list ' + settings.pager_selector;
      }
      if (settings.items_selector.substring(0,1) != '>') {
        settings.items_selector = '> ' + settings.items_selector;
      }

      // Ensure we are refreshing the view component.
      var view_selector = 'div.view-id-' + settings.view_name + '.view-display-id-' + settings.display;
      var $view = $(context).is(view_selector) ? $(context) : $(context).find(view_selector);
      if ($view.length == 0) {
        return;
      }

      // Destroy an existing instance of autopager.
      $.autopager('destroy');

      var content_selector = view_selector + ' ' + settings.content_selector;
      var $items = $view.find(settings.content_selector + ' ' + settings.items_selector);
      var $pager = $view.find(settings.pager_selector);
      var next_selector = view_selector + ' ' + settings.next_selector;
      var $next = $(next_selector);

      var $img_location = $view.find('> div.view-content');
      var img_path = settings.img_path;
      var img = '<div id="views_infinite_scroll-ajax-loader"><img src="' + img_path + '" alt="loading..."/></div>';

      $($pager).hide();
      var group_selector = '', group_holder_selector = '';
      if (settings.content_selector === '> div.view-content > table > tbody') {
        group_selector = view_selector + ' > div.view-content > table' ;
        group_holder_selector = view_selector + ' > div.view-content' ;
      }
      $.autopager({
        disablescript: settings.disablescript,
        appendTo: content_selector,
        content: content_selector + ' ' + settings.items_selector,
        link: next_selector,
        group_selector: group_selector,
        group_holder_selector: group_holder_selector,
        page: 0,
        autoLoad: !settings.manual_load,
        start: function () {
          $img_location.after(img);
        },
        load: function (current, next) {
          $('div#views_infinite_scroll-ajax-loader').remove();
          // attachBehaviors on the whole view
          Drupal.attachBehaviors($view);
          // Use >= because of views page numbers begin at 0.
          if (settings.manual_load && next.page >= settings.pager_max) {
            $next.hide();
          }
        }
      });

      if (settings.manual_load) {
        // The pager is hidden. Pop "next" link out so it will be visible.
        $next.text(settings.text);
        $next.click(function (e) {
          e.preventDefault();
          // do load
          $.autopager('load');
        });
        $($pager).before($next);
        // Wrap the button to allow for easier styling in the theme
        $next.wrap('<div id="views_infinite_scroll_button" />');
      }
      else {
        $($pager).hide();
        // Trigger autoload if content height is less than doc height already
        var prev_content_height = $(content_selector).height();
        do {
          var last = $($items).filter(':last');
          if (last.offset().top + last.height() < $(document).scrollTop() + $(window).height()) {
            last = $($items).filter(':last');
            $.autopager('load');
          }
          else {
            break;
          }
        }
        while ($(content_selector).height() > prev_content_height);
      }
    }
  };

  Drupal.behaviors.views_infinite_scroll = VIS.VFI;

})(jQuery, VIS);
