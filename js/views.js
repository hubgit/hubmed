
var Views = {
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

	Info: Backbone.View.extend({
		initialize: function() {
			this.$el.appendTo("body");
			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Info(data));
			return this;
		},

	}),

	Articles: Backbone.View.extend({
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
				articles.find("section").show();
				articles.find("[data-action=show-abstract]").addClass("expanded");
			}
		},

		add: function(article) {
			var view = new Views.Article({ model: article });
			this.$el.append(view.render().el);
		}
	}),

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
			this.links = new Views.Links({ collection: this.model.links });
			this.metrics = new Views.Metrics({ collection: this.model.metrics });

			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Article(data));

			this.$el.find("[property=creators]").formatAuthors(5, "creator");

			this.$el.find("footer").append(this.links.$el)
			this.$el.find(".context").append(this.metrics.$el);

			return this;
		},

		action: function(event) {
			//event.preventDefault();
			//event.stopPropagation();

			if (event.metaKey || event.ctrlKey) {
				return true;
			}

			var node = $(event.currentTarget);

			switch (node.data("action")) {
				case "show-abstract":
					if (node.hasClass("expanded") && node.attr("property") == url) {
						return true;
					}

					node.toggleClass("expanded").closest("article").find("section").toggle();
				break;
			}

			return false;
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
		tagName: "a",

		className: "metric",

		attributes: {
			target: "_blank"
		},

		initialize: function() {
			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();

			this.$el.attr("href", data.url).text(data.text);
			if(data.domain) this.$el.css("background-image", "url(http://www.google.com/s2/u/0/favicons?domain=" + data.domain + ")")

			return this;
		}
	}),

	Links: Backbone.View.extend({
		className: "links",

		initialize: function() {
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
			this.reset();
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(link) {
			var view = new Views.Link({ model: link });
			view.$el.appendTo(this.$el);
		}
	}),

	Link: Backbone.View.extend({
		tagName: "a",
		className: "link",

		initialize: function() {
			var data = this.model.toJSON();
			this.$el.text(data.text).attr(data.attributes);
		}
	}),

	Pagination: Backbone.View.extend({
		events: {
			"click a": "fetchPage",
			"inview a": "fetchMore"
		},

		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(page) {
			var url = page.get("next");
			if(url) $("<a/>", { href: url, html: "More &darr;", rel: "next" }).appendTo(this.$el);
		},

		fetchPage: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var node = $(event.currentTarget);
			if(node.hasClass("loading")) return;
			node.addClass("loading").html("Loading more&hellip;");

			app.collections.articles
				.fetch({ add: true, url: event.currentTarget.href })
				.done(this.checkItems);
		},

		fetchMore: function(event) {
			if(app.collections.articles.length) {
				this.fetchPage(event);
			} else {
				this.$el.find("a").text("No more items");
			}
		}
	})
};