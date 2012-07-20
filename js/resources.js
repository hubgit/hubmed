/*global Backbone, $, Handlebars, window */

var Templates = {};

$(function() {
	$("[data-template]").each(function loadTemplate() {
		var template = $(this);
		Templates[template.data("template")] = Handlebars.compile(template.html());
	});
});

var Models = {
	Article: Backbone.Model.extend({
		augmentors: {
			altmetric: function() {
				var model = this,
					service = app.services.altmetric,
					data = this.toJSON(),
					path = service.path(data.identifier);

				if(!path) return;

				service.fetch(path).done(function(data) {
					var links = service.parse(data);
					console.log(links);
					model.metrics.reset(links);
				});
			}
		},

		defaults: {
			augmented: {}
		},

		initialize: function() {
			var model = this;
			$.each(this.augmentors, function(name, augmentor) {
				augmentor.call(model);
			});
		}
	})
};

var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			if (options.url) {
				app.services.pubmed.get(options.url).done(options.success);
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
			this.links = data.links;
			return data.items.map(function(item) {
				return new Models.Article(item);
			});
		}
	}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
