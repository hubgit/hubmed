var Views = {
	Input: Backbone.View.extend({
		tagName: "form",

		initialize: function() {
			this.$el.appendTo("body");
			if (location.search) {
				this.parseQueryString().forEach(this.handleQueryPart, this);
			}
			this.render();
		},

		events: {
			"change input[type=checkbox],input[type=radio]": "submitChangedForm"
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Input(data));
		},

		parseQueryString: function() {
			return location.search.substring(1).split("&").map(function(item) {
				return item.split("=").map(decodeURIComponent).map(function(text) {
					return text.replace(/\+/g, " ");
				});
			});
		},

		handleQueryPart: function(item) {
			var name = item[0];
			var value = item[1].replace(/\/$/, "");

			switch (name) {
				case "days":
					this.model.set("days", Number(value));
					return;

				case "term":
					this.model.set("relatedQuery", value.match(/^related:/));
					this.model.set("term", value);
					break;

				case "filter":
					var filters = this.model.get("filters");

					if (typeof filters[value] !== "undefined") {
						filters[value] = true;
						this.model.set("filters", filters);
					}

					break;
			}
		},

		submitChangedForm: function() {
			this.$el.submit();
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
		offset: 0,
		limit: 5,

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

			if (data.image) {
				$("<img/>", { src: "images/" + data.image }).prependTo(this.$el);
			}

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
		tagName: "a",

		events: {
			"click": "fetchPage",
			"inview": "fetchMore"
		},

		initialize: function() {
			this
				.$el
				.attr("href", "#")
				.attr("rel", "next")
				.html("More &darr;")
				.hide()
				.appendTo("body");
		},

		setNextOffset: function() {
			var offset = app.views.articles.offset + app.views.articles.limit;
			this.$el.data("offset", offset).removeClass("loading").html("More &darr;")
			this.$el.show();
		},

		fetchPage: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var node = $(event.currentTarget);

			if (node.hasClass("loading")) {
				return;
			}

			var spinner = $("<img/>", { src: "./images/spinner.gif"}).addClass("spinner");

			node.addClass("loading").text("Loading").append(spinner)

			app.views.articles.offset = node.data("offset");

			app.collections.articles.fetch({ add: true }).done(this.countItems);
		},

		countItems: function() {
			if (!app.collections.articles.length) {
				this.noMoreItems();
			}
		},

		fetchMore: function(event) {
			if (app.collections.articles.length) {
				this.fetchPage(event);
			} else {
				this.noMoreItems();
			}
		},

		noMoreItems: function() {
			this.$el.text("No more items");
		}
	})
};