var Models = {
	Article: Backbone.Model.extend({
		augmentors: {
			altmetric: function() {
				var model = this,
					service = app.services.altmetric,
					data = this.toJSON(),
					path = service.path(data.identifier);

				if(!path) return;

				service.fetch(path).done(function(data) {
					var items = service.parse(data);
					model.metrics.add(items);
				});
			},

			scopus: function() {
				var model = this,
					service = app.services.scopus,
					identifier = this.get("identifier"),
					doi = identifier.doi;

				if(!doi) return;

				service.fetch(doi).done(function(data) {
					var item = service.parse(data);
					if(item) model.metrics.add(item);
				});
			}
		},

		defaults: {
			augmented: {}
		},

		events: {
			"change:identifier": "setLinks"
		},

		initialize: function() {
			this.metrics = new Collections.Metrics();
			this.links = new Collections.Links({ model: Models.Link });
			this.setLinks();

			var model = this;
			$.each(this.augmentors, function(name, augmentor) {
				augmentor.call(model);
			});
		},

		setLinks: function() {
			var identifier = this.get("identifier");

			var items = [
				{
					rel: "fulltext",
					text: "Article",
					target: "_blank",
					href: identifier.doi ? "http://dx.doi.org/" + identifier.doi : "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&cmd=prlinks&retmode=ref&id=" + identifier.pubmed
				},

				{
					rel: "export",
					text: "BibTeX",
					type: "text/bibtex",
					href: app.services.pubmed.url + "?format=text%2Fbibtex&id=" + identifier.pubmed
				},

				{
					rel: "export",
					text: "RIS",
					type: "application/research-info-systems",
					href: app.services.pubmed.url + "?format=application%2Fresearch-info-systems&id=" + identifier.pubmed
				},

				{
					rel: "related",
					text: "Related",
					href: "./?term=related:" + identifier.pubmed
				}
			];

			this.links.reset(items);
		}
	}),

	Link: Backbone.Model.extend({}),
	Info: Backbone.Model.extend({})
};