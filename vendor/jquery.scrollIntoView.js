(function ($) {
	var win = $(window);
	
	$.fn.scrollIntoView = function () {
		return this.each(function() {
			var node = $(this);
			
			var gap = (win.height() - node.height()) / 2;
			
			$("html, body").animate({ 
				scrollTop: node.offset().top - Math.max(20, gap) 
			}, 0);
		});
	};
})(jQuery);
