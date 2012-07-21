/*global Backbone, $, Handlebars, window */


var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			if (options.url) {
				app.services.pubmed.get({ url: options.url }).done(options.success);
			}
			else {
				var matches = options.data.term.match(/^related:(.+)/);
				if(matches) {
					app.services.pubmed.related(matches[1]).done(function(doc) {
						var data = {
							Count: 1000,
							WebEnv: document.evaluate("/eLinkResult/LinkSet/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							QueryKey: document.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
						};

						app.services.pubmed.history(data).done(options.success);
					});
				}
				else {
					app.services.pubmed.search(options.data.term).done(function(doc) {
						var data = {
							Count: document.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							WebEnv: document.evaluate("/eSearchResult/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							QueryKey: document.evaluate("/eSearchResult/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
						};

						app.services.pubmed.history(data).done(options.success);
					});
				}
			}
		},

		parse: function(data) {
			app.collections.pages.reset(data.links);

			if(!data.items) return [];

			return data.items.map(function(item) {
				return new Models.Article(item);
			});
		}
	}),
	Pages: Backbone.Collection.extend({}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
