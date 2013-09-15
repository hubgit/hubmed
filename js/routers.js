var Routers = {
	Search: Backbone.Router.extend({
		routes: {
			"": "index"
		},

		initialize: function(options) {
			console.log("i");

			app.models = {
				query: new Models.Query(),
				options: new Models.Options()
			};

			app.collections = {
				articles: new Collections.Articles({ model: Models.Article })
			};

			app.views = {
				input: new Views.Input({
					id: "input",
					className: "wrapper",
					model: app.models.query
				}),

				options: new Views.Options({
					id: "options",
					className: "wrapper",
					model: app.models.query
				}),

				articles: new Views.Articles({
					id: "articles",
					className: "wrapper",
					collection: app.collections.articles
				}),

				pagination: new Views.Pagination({
					id: "pagination",
					className: "wrapper pagination"
				})
			};

			this.route(/\/?.*/, 'index', this.index);
		},

		index: function() {
			console.log("index");

			app.models.query = new Models.Query();
			app.models.options =new Models.Options();

			this.query = app.models.query;

			app.collections.articles.reset();

			if (location.search) {
				this.parseQueryString().forEach(this.handleQueryPart, this);

				// only use "days" for "related" queries
				if (!this.query.get("relatedQuery")) {
					this.query.set("days", 0);
				}
			}

			/** Fetch the list of articles and update the collection **/

			if (app.models.query.get("term")) {
				app.views.pagination.$el.show();
			} else {
				app.views.pagination.$el.hide();
				app.views.input.$("input[name=term]").focus();
			}

			app.views.pagination.start();

			app.views.articles.$el.toggleClass("show-metrics", app.models.options.get("metrics"));

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
					this.query.set("days", Number(value));
					return;

				case "term":
					this.query.set("relatedQuery", value.match(/^related:/));
					this.query.set("term", value);
					break;

				case "filter":
					var filters = this.query.get("filters");

					if (typeof filters[value] !== "undefined") {
						filters[value].enabled = true;
						this.query.set("filters", filters);
					}

					break;
			}
		},
	})
}