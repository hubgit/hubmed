(function ($) {
	$.fn.navigation = function () {
		return this.each(function() {
			$(this).on("keydown", function(event) {
				if ($(event.target).is(":input")) {
					return;
				}
				console.log(event.which);

				switch (event.which) {
					case 74: // j = down
					var currentArticle = $("article.expanded").removeClass("expanded");
					var nextArticle = currentArticle.length ? currentArticle.next("article") : $("article:first");
					nextArticle.addClass("expanded").scrollIntoView();
					break;

					case 75: // k = up
					var currentArticle = $("article.expanded").removeClass("expanded");
					if (currentArticle.length) {
						currentArticle.prev("article").addClass("expanded").scrollIntoView();
					}
					break;

					case 13: // enter = open
					var currentArticle = $("article.expanded").removeClass("expanded");
					if (currentArticle.length) {
						var href = currentArticle.find("[property=url]").attr("href");
						window.open(href);
					}
					break;
				}
			});
		});
	};
})(jQuery);
