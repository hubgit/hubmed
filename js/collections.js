/*global Backbone, $, Handlebars, window */


var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			var input = app.models.query.toJSON();

			if(input.term.match(/^related:(.+)/)) {
				return app.services.pubmed.related(input).done(function(doc) {
					var data = {
						count: 1000,
						webEnv: document.evaluate("/eLinkResult/LinkSet/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
						queryKey: document.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
					};

					app.models.query.set(data);

					app.services.pubmed.history(data).done(options.success);
				});
			}

			return app.services.pubmed.search(input).done(function(doc) {
				var data = {
					count: document.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
					webEnv: document.evaluate("/eSearchResult/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
					queryKey: document.evaluate("/eSearchResult/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
				};

				app.models.query.set(data);

				app.services.pubmed.history(data).done(options.success);
			});
		},

		parse: function(doc) {
			var fragment = app.processor.transformToFragment(doc, document);
			var node = document.createElement("div");
			node.appendChild(fragment);

			var items = $(node.firstChild).find("article").map(function() {
				var item = {};
				var node = $(this);

				node.children("[property]").each(function() {
					var node = $(this);
					var property = node.attr("property");

					if (node.hasClass("multiple")) {
						if (typeof item[property] === "undefined") {
							item[property] = [];
						}

						item[property].push(node.html());
					} else {
						item[property] = node.html();
					}
				});

				return new Models.Article(item);
			});

			return items.toArray();
		}
	}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
