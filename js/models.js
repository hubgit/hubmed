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
				/*{
					text: "Abstract",
					attributes: {
						rel: "abstract",
						href: "./?term=" + identifier.pubmed + " [UID]",
						"class": "link expandable",
						"data-action": "show-abstract"
					}
				},*/

				{
					text: "RIS",
					attributes: {
						rel: "export",
						download: "hubmed-" + identifier.pubmed,
						href: app.services.pubmed.url + "?format=application%2Fresearch-info-systems&id=" + identifier.pubmed,
						type: "application/research-info-systems"
					}
				},

				{
					text: "BibTeX",
					attributes: {
						rel: "export",
						download: "hubmed-" + identifier.pubmed,
						href: app.services.pubmed.url + "?format=text%2Fbibtex&id=" + identifier.pubmed,
						type: "text/bibtex"
					}
				},

				{
					text: "Related",
					attributes: {
						rel: "related",
						href: "./?term=related:" + identifier.pubmed
					}
				}
			];

			this.links.reset(items);
		}
	}),

	Query: Backbone.Model.extend({
		defaults: {
		    "filters":  {
		    	"free full text": false
		    },
		    "days": "0",
		    "term": ""
	    }
	}),
	Link: Backbone.Model.extend({}),
	Info: Backbone.Model.extend({})
};