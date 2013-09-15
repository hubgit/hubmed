var app = {
	init: function() {
		app.services = {
			pubmed: new PubMed(),
			altmetric: new Altmetric(),
			scopus: new Scopus(),
			oa: new OA()
		};

		app.routers = {
			search: new Routers.Search(),
		};

		$(document).navigation(); // listen for keyboard navigation
		Backbone.history.start({pushState: true, });
	}
};

$(app.init);