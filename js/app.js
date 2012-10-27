/*jshint browser: true, newcap: true, nomen: false, plusplus: false, undef: true, white: false */
/*global Collections, Models, Templates, Views, Services, PubMed, jQuery, Handlebars, $ */

var app = {};

$(function() {
	/** Fetch the list of articles and update the collection **/
	var refresh = function() {
		// reset the AJAX queue
		$.ajaxQueue.stop(true);

		// empty the collection
		app.collections.articles.reset();
		app.collections.pages.reset();

		var input = $("input[name=term]");
		var term = input.val();
		var days = Number($("input[name=days]:checked").val());
		if(term) {
			app.collections.articles.fetch({ data: { term: term, n: 10, days: days } });
		} else {
			input.focus();
		}
	};

	app.services = {
		pubmed: new PubMed(),
		altmetric: new Altmetric(),
		scopus: new Scopus()
	};

	app.models = {
		info: new Models.Info()
	};

	app.collections = {
		articles: new Collections.Articles(),
		pages: new Collections.Pages()
	};

	app.views = {
		input: new Views.Input({
			id: "input",
			className: "wrapper",
		}),

		info: new Views.Info({
			id: "info",
			className: "wrapper",
			model: app.models.info
		}),

		articles: new Views.Articles({
			id: "articles",
			className: "wrapper",
			collection: app.collections.articles
		}),

		pagination: new Views.Pagination({
			id: "pagination",
			className: "wrapper pagination",
			collection: app.collections.pages
		})
	};

	refresh();
});
