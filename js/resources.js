/*global Backbone, $, Handlebars, window */

var Templates = {};

$(function() {
	$("[data-template]").each(function loadTemplate() {
		var template = $(this);
		Templates[template.data("template")] = Handlebars.compile(template.html());
	});
});

var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			var self = this;

			if (options.url) {
				this.service.get(options.url).done(options.success);
			}
			else {
				var matches = options.data.term.match(/^related:(.+)/);
				if(matches) {
					this.service.related(matches[1]).done(function(doc) {
						var data = {
							WebEnv: document.evaluate("/eLinkResult/LinkSet/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							QueryKey: document.evaluate("/eLinkResult/LinkSet/LinkSetDbHistory/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
						};

						var url = self.service.buildHistoryURL(data);
						self.service.get(url).done(options.success);
					});
				}
				else {
					this.service.search(options.data.term).done(function(doc) {
						var data = {
							Count: document.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							WebEnv: document.evaluate("/eSearchResult/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
							QueryKey: document.evaluate("/eSearchResult/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
						};

						var url = self.service.buildHistoryURL(data);
						self.service.get(url).done(options.success);
					});
				}
			}
        },

        parse: function(data) {
            this.links = data.links;
            return data.items;
        }
	}),
	Links: Backbone.Collection.extend({})
};

var Views = {
	Article: Backbone.View.extend({
		tagName: "article",

		attributes: {
			"vocab": "http://schema.org/",
			"typeof": "MedicalScholarlyArticle"
		},

		events: {
			"click .action": "action"
		},

		initialize: function() {
			this.model.on("change", this.render, this);
		},

		render: function() {
			this.$el.html(Templates.Article(this.model.toJSON()));
			return this;
		},

		action: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $node = $(event.currentTarget);

			switch ($node.data("action")) {
				case "show-abstract":
					$node.closest("article").addClass("abstract-open").find("[property=abstract]").show();
					break;
			}
		}
	}),

	Articles: Backbone.View.extend({
		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
		},

		events: {
			//"click a": "openNewWindow"
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);

			var articles = $("article");
			if(articles.length === 1) {
				articles.find("[property=abstract]").show();
				articles.find("[data-action=show-abstract]").hide();
			}
		},

		add: function(article) {
			var view = new Views.Article({ model: article });
			this.$el.append(view.render().el);
		}
	}),

	Pagination: Backbone.View.extend({
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
		},
	})
};