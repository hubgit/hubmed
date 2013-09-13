(function ($) {
	$.fn.navigation = function () {
		return this.each(function() {
			$(this).on("keydown", function(event) {
				// ignore keypresses in inputs
				if ($(event.target).is(":input")) {
					return;
				}

				switch (event.which) {
					case 74: // j = down
						var currentArticle = $("article.expanded");
						currentArticle.trigger("toggleExpanded");
						var nextArticle = currentArticle.length ? currentArticle.next("article") : $("article:first");
						console.log(nextArticle);
						nextArticle.trigger("toggleExpanded").scrollIntoView();
						break;

					case 75: // k = up
						var currentArticle = $("article.expanded");
						currentArticle.trigger("toggleExpanded");
						if (currentArticle.length) {
							currentArticle.prev("article").trigger("toggleExpanded").scrollIntoView();
						}
						break;

					case 13: // enter = open
						var currentArticle = $("article.expanded");
						currentArticle.trigger("toggleExpanded");
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
