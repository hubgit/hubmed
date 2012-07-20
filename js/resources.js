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

var Views = {
	Article: Backbone.View.extend({
		tagName: "article",

		attributes: {
			"vocab": "http://schema.org/",
			"typeof": "MedicalScholarlyArticle"
		},

		events: {
			"click a[data-action]": "action"
		},

		initialize: function() {
			this.model.metrics = new Collections.Metrics();
			this.metrics = new Views.Metrics({ collection: this.model.metrics });

			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			data["export"] = app.services.pubmed.url;
			this.$el.html(Templates.Article(data)).append(this.metrics.$el);
			return this;
		},

		action: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $node = $(event.currentTarget);

			switch ($node.data("action")) {
				case "show-abstract":
					$node.toggleClass("expanded").closest("article").find(".abstract").toggle();
				break;
			}
		}
	}),

	Articles: Backbone.View.extend({
		events: {
			//"click a": "openNewWindow"
		},

		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);

			var articles = $("article");
			if(articles.length === 1) {
				articles.find("[property=abstract]").show();
				//articles.find("[data-action=show-abstract]").hide();
			}
		},

		add: function(article) {
			var view = new Views.Article({ model: article });
			this.$el.append(view.render().el);
		}
	}),

	Pagination: Backbone.View.extend({
		events: {
			"click a": "fetchPage",
			"inview a": "fetchPage"
		},

		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(links) {
			var url = links.get("next");
			if (!url) return;

			$("<a/>", { href: url, html: "More &darr;", rel: "next" }).appendTo(this.$el);
		},

		handleResponse: function(data) {
			app.collections.links.reset(data.links);
		},

		fetchPage: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var node = $(event.currentTarget);
			if(node.hasClass("loading")) return;
			node.addClass("loading").html("Loading more&hellip;");

			app.collections.articles.fetch({ add: true, url: event.currentTarget.href, success: this.handleResponse });
		}
	}),

	Input: Backbone.View.extend({
		tagName: "form",

		initialize: function() {
			this.$el.appendTo("body");
			this.render();
		},

		render: function() {
			$("<input/>", { type: "text", name: "term" }).appendTo(this.$el);
			$("<input/>", { type: "submit", value: "search" }).appendTo(this.$el);

			this.parseQueryString().forEach(function(item) {
				this.$el.find("[name='" + item[0] + "']").val(item[1]);
			}, this);
		},

		parseQueryString: function() {
			return location.search.substring(1).split("&").map(function(item) {
				return item.split("=").map(decodeURIComponent).map(function(text) {
					return text.replace(/\+/g, " ");
				});
			});
		}
	}),

	Metrics: Backbone.View.extend({
		className: "metrics",

		initialize: function() {
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(metric) {
			var view = new Views.Metric({ model: metric });
			view.render().$el.appendTo(this.$el);
		}
	}),

	Metric: Backbone.View.extend({
		tagName: "span",

		initialize: function() {
			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Metric(data));
			return this;
		}
	})
};