var Models = {
	Query: Backbone.Model.extend({
		defaults: {
		    "filters":  {
		    	"free full text": false
		    },
		    "days": 0,
		    "term": "",
	    }
	}),

	Article: Backbone.Model.extend({
		augmentors: {
			altmetric: function() {
				var model = this,
					service = app.services.altmetric,
					data = this.toJSON(),
					path = service.path({ doi: data.doi, pubmed: data.pmid });

				if(!path) return;

				service.fetch(path).done(function(data) {
					var items = service.parse(data);
					model.metrics.add(items);
				});
			},

			scopus: function() {
				var model = this,
					service = app.services.scopus,
					doi = this.get("doi");

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
			var pmid = this.get("pmid");

			var items = [
				/*{
					text: "Abstract",
					attributes: {
						rel: "abstract",
						href: "./?term=" + pmid + " [UID]",
						"class": "link expandable",
						"data-action": "show-abstract"
					}
				},*/

				{
					text: "RIS",
					attributes: {
						rel: "export",
						download: "hubmed-" + pmid,
						href: app.services.pubmed.url + "?format=application%2Fresearch-info-systems&id=" + pmid,
						type: "application/research-info-systems"
					}
				},

				{
					text: "BibTeX",
					attributes: {
						rel: "export",
						download: "hubmed-" + pmid,
						href: app.services.pubmed.url + "?format=text%2Fbibtex&id=" + pmid,
						type: "text/bibtex"
					}
				},

				{
					text: "Related",
					attributes: {
						rel: "related",
						href: "./?term=related:" + pmid
					}
				}
			];

			this.links.reset(items);
		}
	}),

	Link: Backbone.Model.extend({}),
	Info: Backbone.Model.extend({})
};