/*jshint browser: true, newcap: true, nomen: false, plusplus: false, undef: true, white: false */
/*global Collections, Models, Templates, Views, Services, PubMed, jQuery, Handlebars, $ */

var app = {};

$(function() {
	/** Fetch the list of articles and update the collection **/
	var refresh = function(xslXHR) {
		app.processor = new XSLTProcessor();
		app.processor.importStylesheet(xslXHR);

		// reset the AJAX queue
		//$.ajaxQueue.stop(true);

		// empty the collection
		//app.collections.articles.reset();

		$("input[name=term]").focus();
		app.collections.articles.fetch();
	};

	app.services = {
		pubmed: new PubMed(),
		altmetric: new Altmetric(),
		scopus: new Scopus()
	};

	app.models = {
		query: new Models.Query
	};

	app.collections = {
		articles: new Collections.Articles()
	};

	app.views = {
		input: new Views.Input({
			id: "input",
			className: "wrapper",
			model: app.models.query
		}),

		info: new Views.Info({
			id: "info",
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
			className: "wrapper pagination",
		})
	};

	var fetchXSL = $.ajax({
		url: "results.xsl",
		dataType: "xml"
	});

	$.when(fetchXSL).done(refresh);
});
