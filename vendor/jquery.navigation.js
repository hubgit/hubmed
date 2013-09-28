(function ($) {
	$.fn.navigation = function () {
		return this.each(function() {
			$(this).on("keydown", function(event) {
				// ignore keypresses in inputs
				if ($(event.target).is(":input")) {
					return;
				}

				// TODO: focus active node and set tab order to -1
				switch (event.which) {
					case 74: // j = down
						var currentArticle = $(".article.active");
						currentArticle.find("article").trigger("toggleExpanded");
						var nextArticle = currentArticle.length ? currentArticle.next(".article") : $(".article:first");
						nextArticle.find("article").trigger("toggleExpanded").scrollIntoView();
						break;

					case 75: // k = up
						var currentArticle = $(".article.active");
						currentArticle.find("article").trigger("toggleExpanded");
						if (currentArticle.length) {
							currentArticle.prev(".article").find("article").trigger("toggleExpanded").scrollIntoView();
						}
						break;

					case 13: // enter = open
						var currentArticle = $(".article.active");
						currentArticle.find("article").trigger("toggleExpanded");
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
