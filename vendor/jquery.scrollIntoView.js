(function ($) {
	$.fn.scrollIntoView = function () {
		return this.each(function() {
			$("html, body").animate({ scrollTop: $(this).offset().top - 10 }, 10);
		});
	};
})(jQuery);
