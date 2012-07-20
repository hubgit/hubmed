
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