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

		var term = $("input[name=term]").val();
		if(term) {
			app.collections.articles.fetch({ data: { term: term, n: 10 } });
		}
	};

	app.services = {
		pubmed: new PubMed(),
		altmetric: new Altmetric(),
		scopus: new Scopus()
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
