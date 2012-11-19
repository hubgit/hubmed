/*jshint browser: true, newcap: true, nomen: false, plusplus: false, undef: true, white: false */
/*global Collections, Models, Templates, Views, Services, PubMed, jQuery, Handlebars, $ */

var app = {};

$(function() {
	/** Fetch the list of articles and update the collection **/
	var refresh = function() {
		if (app.models.query.get("term")) {
			app.views.pagination.$el.show();
		} else {
			app.views.input.$("input[name=term]").focus();
		}

		app.views.pagination.start();
	};

	app.services = {
		pubmed: new PubMed(),
		altmetric: new Altmetric(),
		scopus: new Scopus(),
		googleplus: new GooglePlus()
	};

	app.models = {
		auth: new Models.Auth(),
		query: new Models.Query(),
		options: new Models.Options()
	};

	app.collections = {
		articles: new Collections.Articles({ model: Models.Article })
	};

	app.views = {
		auth: new Views.Auth({
			id: "auth",
			model: app.models.auth
		}),

		options: new Views.Options({
			id: "options",
			model: app.models.options
		}),

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

	app.views.articles.$el.toggleClass("show-metrics", app.models.options.get("metrics"));

	refresh();
});
