/*jshint browser: true, newcap: true, nomen: false, plusplus: false, undef: true, white: false */
/*global Collections, Models, Templates, Views, Services, PubMed, jQuery, Handlebars, $ */

$(function() {
	var articlesView, paginationView;

	var Services = {
		PubMed: new PubMed()
	};

	var articles = new Collections.Articles();
	articles.service = Services.PubMed;

	var links = new Collections.Links();

	/** Fetch the list of articles and update the collection **/

	var handleResponse = function(data) {
		links.reset(data.links);
	};

	var fetchPage = function(event) {
		event.preventDefault();
		event.stopPropagation();
		$(event.currentTarget).addClass("loading").html("Loading more&hellip;");
		articles.fetch({ add: true, url: event.currentTarget.href, success: handleResponse });
	};

	var refresh = function() {
		// reset the AJAX queue
		$.ajaxQueue.stop(true);

		// empty the collection
		articles.reset();
		links.reset();

		var term = $("input[name=term]").val();
		if(term) search(term, 10);
	};

	var search = function(term, n) {
		// fetch the list of items and display them
		var data = {
			term: term,
			n: 10,
		};

		articles.fetch({ data: data, success: handleResponse });
	};

	/** Render views **/

	var renderViews = function() {
		inputView = new Views.Input({
			id: "input",
			className: "wrapper",
		});

		articlesView = new Views.Articles({
			id: "articles",
			className: "wrapper",
			collection: articles
		});

		var events = {
			"click a": fetchPage,
			"inview a[rel=next]": fetchPage
		};

		paginationView = new Views.Pagination({
			id: "pagination",
			className: "wrapper pagination",
			collection: links
		});

		paginationView.delegateEvents(events);
	};


	renderViews();
	refresh();
});
