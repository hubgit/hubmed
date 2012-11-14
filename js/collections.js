/*global Backbone, $, Handlebars, window */


var Collections = {
	Articles: Backbone.Collection.extend({
		sync: function(method, collection, options) {
			var input = app.models.query.toJSON();

			if (!input.term) {
				return;
			}

			var view = app.views.articles;

			if (view.offset) {
				var data = app.models.query.toJSON();

				if (view.offset >= data.count) {
					app.views.pagination.noMoreItems();
					return;
				}

				return app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
			}

			if (input.term.match(/^related:(.+)/)) {
				return app.services.pubmed.related(input).done(function(doc) {
					var template = {
						count: ":1000", // note: can be less than 1000
						webEnv: "/eLinkResult/LinkSet/WebEnv",
						queryKey: "/eLinkResult/LinkSet/LinkSetDbHistory/QueryKey",
						error: "/eLinkResult/LinkSet/LinkSetDbHistory/ERROR",
						info: "/eLinkResult/LinkSet/LinkSetDbHistory/Info"
					};

					var data = Jath.parse(template, doc);

					if (data.error || data.info) {
						app.views.pagination.noMoreItems();
						return;
					}

					app.models.query.set(data);

					app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
				});
			}

			return app.services.pubmed.search(input).done(function(doc) {
				var template = {
					count: "/eSearchResult/Count",
					webEnv: "/eSearchResult/WebEnv",
					queryKey: "/eSearchResult/QueryKey"
				};

				var data = Jath.parse(template, doc);

				app.models.query.set(data);

				app.services.pubmed.history(data, view.offset, view.limit).done(options.success);
			});
		},

		itemTemplate: [
			"/PubmedArticleSet/PubmedArticle",
			{
				pmid: "PubmedData/ArticleIdList/ArticleId[@IdType='pubmed']",
				doi: "PubmedData/ArticleIdList/ArticleId[@IdType='doi']",
				title: "MedlineCitation/Article/ArticleTitle",
				creator: [
					"MedlineCitation/Article/AuthorList/Author",
					{
						forename: "ForeName",
						initials: "Initials",
						lastname: "LastName",
						name: "Name",
					}
				],
				abstract: [
					"MedlineCitation/Article/Abstract",
					{
						text: "AbstractText",
						label: "@Label"
					}
				],
				//pagination: "MedlineCitation/Article/Pagination/MedlinePgn",
				journalISSN: "MedlineCitation/Article/Journal/ISSN",
				journalTitle: "MedlineCitation/Article/Journal/Title",
				journalISOAbbreviation: "MedlineCitation/Article/Journal/ISOAbbreviation",
				//journalVolume: "MedlineCitation/Article/Journal/JournalIssue/Volume",
				//journalIssue: "MedlineCitation/Article/Journal/JournalIssue/Issue",
				pubDate: "MedlineCitation/Article/Journal/JournalIssue/PubDate/MedlineDate",
				pubYear: "MedlineCitation/Article/Journal/JournalIssue/PubDate/Year",
				pubMonth: "MedlineCitation/Article/Journal/JournalIssue/PubDate/Month",
				//pubDay: "MedlineCitation/Article/Journal/JournalIssue/PubDate/Day",
			}
		],

		parse: function(doc) {
			var items = Jath.parse(this.itemTemplate, doc);
			console.log(items);

			if (items.length) {
				app.views.pagination.setNextOffset();

				return $.map(items, function(item) {
					item.title = item.title.replace(/\.$/, "");
					item.journalISOAbbreviation = item.journalISOAbbreviation.replace(/\./g, "");

					return new Models.Article(item);
				});
			}

			app.views.pagination.noMoreItems();
		}
	}),
	Links: Backbone.Collection.extend({}),
	Metrics: Backbone.Collection.extend({})
};
