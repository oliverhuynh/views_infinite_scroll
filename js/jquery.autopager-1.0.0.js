/*
 * jQuery.autopager v1.0.0
 *
 * Copyright (c) lagos
 * Dual licensed under the MIT and GPL licenses.
 */
(function($) {
	var window = this, options = {},
		content, currentUrl, nextUrl,
		active = false,
		defaults = {
			autoLoad: true,
			page: 1,
      disablescript: false,
      group_selector: '',
      group_holder_selector: '',
			content: '.content',
			link: 'a[rel=next]',
			insertBefore: null,
			appendTo: null,
			start: function() {},
			load: function() {},
			disabled: false
		};

	$.autopager = function(_options) {
		var autopager = this.autopager;

		if (typeof _options === 'string' && $.isFunction(autopager[_options])) {
			var args = Array.prototype.slice.call(arguments, 1),
				value = autopager[_options].apply(autopager, args);

			return value === autopager || value === undefined ? this : value;
		}

		_options = $.extend({}, defaults, _options);
		autopager.option(_options);

		content = $(_options.content).filter(':last');
		if (content.length) {
			if (!_options.insertBefore && !_options.appendTo) {
				var insertBefore = content.next();
				if (insertBefore.length) {
					set('insertBefore', insertBefore);
				} else {
					set('appendTo', content.parent());
				}
			}
		}

		setUrl();

		return this;
	};

	$.extend($.autopager, {
		option: function(key, value) {
			var _options = key;

			if (typeof key === "string") {
				if (value === undefined) {
					return options[key];
				}
				_options = {};
				_options[key] = value;
			}

			$.each(_options, function(key, value) {
				set(key, value);
			});
			return this;
		},

		enable: function() {
			set('disabled', false);
			return this;
		},

		disable: function() {
			set('disabled', true);
			return this;
		},

		destroy: function() {
			this.autoLoad(false);
			options = {};
			content = currentUrl = nextUrl = undefined;
			return this;
		},

		autoLoad: function(value) {
			return this.option('autoLoad', value);
		},

		load: function() {
			if (active || !nextUrl || options.disabled) {
				return;
			}

			active = true;
			options.start(currentHash(), nextHash());
			$.get(nextUrl, insertContent);
			return this;
		}

	});

	function set(key, value) {
		switch (key) {
			case 'autoLoad':
				if (value && !options.autoLoad) {
					$(window).scroll(loadOnScroll);
				} else if (!value && options.autoLoad) {
					$(window).unbind('scroll', loadOnScroll);
				}
				break;
			case 'insertBefore':
				if (value) {
					options.appendTo = null;
				}
				break
			case 'appendTo':
				if (value) {
					options.insertBefore = null;
				}
				break
		}
		options[key] = value;
	}

	function setUrl(context) {
		currentUrl = nextUrl || window.location.href;
		nextUrl = $(options.link, context).attr('href');
	}

	function loadOnScroll() {
		if (content.offset().top + content.height() < $(document).scrollTop() + $(window).height()) {
			$.autopager.load();
		}
	}

  function groupHandle(nextPage) {
    if (options.group_selector != '') {
      // Groups ability
      var $nextcontentGroup = nextPage.find(options.group_selector);
      if (!!$nextcontentGroup.children('caption').length)  {
        $nextcontentGroup.each(function() {
          // Find the corresponding table by caption
          var caption = $(this).children('caption').text();
          var $foundTable = false;
          $(options.group_selector).each(function() {
            if ($(this).children('caption').text() == caption) {
              $foundTable = $(this);
              return false;
            }
          });

          // Insert items or the whole group
          if ($foundTable === false) {
            $(this).appendTo($(options.group_holder_selector));
          }
          else {
            $(this).find('> tbody > tr').appendTo($foundTable.find('> tbody'));
          }
        });
        return $nextcontentGroup;
      }
    }
    return false;
  }

	function insertContent(res) {
    if (options.disablescript) {
      res = res.replace(/<script(.|\s)*?\/script>/g, "");// Allow script to get the setting turned on.
    }

		var _options = options,
			nextPage = $('<div/>').append(res),
/*
			nextPage = $('<div/>').append(res.replace(new RegExp("<script", 'g'), "<s1rpt")).replace(new RegExp("script>", 'g'), "s1rpt>")),//(/<script(.|\s)*?\/script>/g, "")),
      nextScripts = nextPage.find('s1rpt'),
			nextContent = nextPage.find(_options.content);*/
			nextContent;
		set('page', _options.page + 1);
		setUrl(nextPage);
    nextContent = groupHandle(nextPage);
    // Single handle
    if (nextContent === false) {
      nextContent = nextPage.find(_options.content);
      if (nextContent.length) {
        if (_options.insertBefore) {
          nextContent.insertBefore(_options.insertBefore);
        } else {
          nextContent.appendTo(_options.appendTo);
        }
      }
    }

    if (nextContent && nextContent.length) {
			_options.load.call(nextContent.get(), currentHash(), nextHash());
			content = nextContent.filter(':last');
		}
		active = false;
	}

	function currentHash() {
		return {
			page: options.page,
			url: currentUrl
		};
	}

	function nextHash() {
		return {
			page: options.page + 1,
			url: nextUrl
		};
	}
})(jQuery);
