/*global Backbone, $, Handlebars, window */


var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			var input = app.models.query.toJSON();

			if (!input.term) {
				return;
			}

			var view = app.views.articles;

			if (view.offset) {
				var data = app.models.query.toJSON();

				if (view.offset >= data.count) {
					app.views.pagination.noMoreItems();
					return;
				}

				return app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
			}

			if(input.term.match(/^related:(.+)/)) {
				return app.services.pubmed.related(input).done(function(doc) {
					var errorNode = doc.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/ERROR", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					if (errorNode) {
						app.views.pagination.noMoreItems();
						return;
					}

					var errorNode = doc.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/Info", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					if (errorNode) {
						app.views.pagination.noMoreItems();
						return;
					}

					var data = {
						count: 1000, // note: can be less than 1000
						webEnv: doc.evaluate("/eLinkResult/LinkSet/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
						queryKey: doc.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
					};

					app.models.query.set(data);

					app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
				});
			}

			return app.services.pubmed.search(input).done(function(doc) {
				var data = {
					count: doc.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
					webEnv: doc.evaluate("/eSearchResult/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
					queryKey: doc.evaluate("/eSearchResult/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
				};

				app.models.query.set(data);

				app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
			});
		},

		parse: function(doc) {
			if (window.XSLTProcessor) {
				var fragment = app.processor.transformToFragment(doc, document);
			} else {
				var xml = new ActiveXObject("Msxml2.DOMDocument.6.0");
				xml.loadXML(doc.xml);
				console.log(xml);
				var fragment = xml.transformNode(app.processor);
				console.log(fragment);
			}

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

			if (items.length) {
				app.views.pagination.setNextOffset();

				return items.toArray();
			}

			app.views.pagination.noMoreItems();
		}
	}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
