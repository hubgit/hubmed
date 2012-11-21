var Views = {
	Options: Backbone.View.extend({
		tagName: "form",

		events: {
			"change input": "handleChange"
		},

		initialize: function() {
			this.$el.appendTo("body");

			var metrics = $.cookie("metrics") === "true";
			this.model.set("metrics", metrics);

			var saveType = $.cookie("saveType");
			this.model.set("saveType", saveType ? saveType : "com.mendeley");

			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Options(data));

			return this;
		},

		handleChange: function(event) {
			var metrics = this.$("[name=metrics]").prop("checked");

			if (!metrics) {
				this.setWithCookie("metrics", metrics);
			} else if (confirm("Enabling this will query Altmetric and Scopus for article-level metrics, and they will be able to see your search terms. Your choice will be stored in a cookie.")) {
				this.setWithCookie("metrics", metrics);
			} else {
				event.preventDefault();
			}
		},

		setWithCookie: function(name, metrics) {
			this.model.set(name, metrics);
			$.cookie(name, metrics, { expires: 30 });
			window.location.reload(); // TODO: just update the page
		}
	}),

	Input: Backbone.View.extend({
		tagName: "form",

		attributes: {
			autocapitalize: "off"
		},

		events: {
			"change input[type=checkbox],select": "submitChangedForm",
			"click .clear": "clearInput",
		},

		initialize: function() {
			this.$el.appendTo("body");

			if (location.search) {
				this.parseQueryString().forEach(this.handleQueryPart, this);

				// only use "days" for "related" queries
				if (!this.model.get("relatedQuery")) {
					this.model.set("days", 0);
				}
			}

			this.model.on("change", this.render, this);
			this.render();
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Input(data));
		},

		parseQueryString: function() {
			return location.search.substring(1).split("&").map(function(item) {
				return item.split("=").map(decodeURIComponent).map(function(text) {
					return text.replace(/\+/g, " ");
				});
			});
		},

		handleQueryPart: function(item) {
			var name = item[0];
			var value = item[1].replace(/\/$/, "");

			switch (name) {
				case "days":
					this.model.set("days", Number(value));
					return;

				case "term":
					this.model.set("relatedQuery", value.match(/^related:/));
					this.model.set("term", value);
					break;

				case "filter":
					var filters = this.model.get("filters");

					if (typeof filters[value] !== "undefined") {
						filters[value].enabled = true;
						this.model.set("filters", filters);
					}

					break;
			}
		},

		submitChangedForm: function() {
			this.$el.submit();
		},

		clearInput: function() {
			this.model.set("term", null);
			this.$("[name=term]").val("").focus();
		},

		selectInput: function(event) {
			$(event.currentTarget).select();
		}
	}),

	Articles: Backbone.View.extend({
		offset: 0,
		limit: 5,

		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
		},

		reset: function() {
			this.$el.empty();

			this.collection.each(this.add, this);

			var articles = $("article");

			if (articles.length === 1) {
				articles.addClass("expanded");
			}
		},

		add: function(article) {
			var view = new Views.Article({ model: article });
			this.$el.append(view.render().el);
		}
	}),

	Article: Backbone.View.extend({
		tagName: "article",

		attributes: {
			"vocab": "http://schema.org/",
			"typeof": "MedicalScholarlyArticle"
		},

		events: {
			"click a[data-action]": "action"
		},

		initialize: function() {
			this.links = new Views.Links({ collection: this.model.links });
			this.metrics = new Views.Metrics({ collection: this.model.metrics });

			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Article(data));
			this.$el.attr("id", "article-" + data.pmid);

			this.$el.find("[property=creators]").formatAuthors(5, "creator");

			this.$el.find("footer").prepend(this.links.$el);
			this.$el.find(".context").append(this.metrics.$el);

			return this;
		},

		action: function(event) {
			if (event.metaKey || event.ctrlKey) {
				return true;
			}

			var node = $(event.currentTarget);

			switch (node.data("action")) {
				case "show-abstract":
					var article = node.closest("article");

					if (article.hasClass("expanded")) {
						return true;
					}

					article.toggleClass("expanded");
				break;
			}

			return false;
		}
	}),

	Metrics: Backbone.View.extend({
		tagName: "span",
		className: "metrics",

		initialize: function() {
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(metric) {
			var view = new Views.Metric({ model: metric });
			view.render().$el.appendTo(this.$el);
		}
	}),

	Metric: Backbone.View.extend({
		tagName: "a",

		className: "metric",

		attributes: {
			target: "_blank"
		},

		initialize: function() {
			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();

			this.$el.attr("href", data.url).text(data.text);

			if (data.image) {
				$("<img/>", { src: "images/" + data.image }).prependTo(this.$el);
			}

			return this;
		}
	}),

	Links: Backbone.View.extend({
		className: "links",

		events: {
			"mouseenter .preferred-save-type": "showOptionalSaveTypes",
			"mouseleave": "hideOptionalSaveTypes",
		},

		initialize: function() {
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
			this.reset();
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
			this.$(".link[rel=save]").wrapAll("<span class='save-links'></span>");
		},

		add: function(link) {
			var view = new Views.Link({ model: link });

			var attributes = link.get("attributes");

			if (attributes.type === app.models.options.get("saveType")) {
				view.$el.addClass("preferred-save-type");
			}

			view.$el.appendTo(this.$el);
		},

		showOptionalSaveTypes: function(event) {
			$(event.currentTarget).closest(".links").addClass("expand-save");
		},

		hideOptionalSaveTypes: function(event) {
			$(event.currentTarget).closest(".links").removeClass("expand-save");
		}
	}),

	Link: Backbone.View.extend({
		tagName: "a",
		className: "link",

		events: {
			"click": "handleClick"
		},

		initialize: function() {
			var data = this.model.toJSON();
			this.$el.html(data.text).attr(data.attributes);
		},

		handleClick: function(event) {
			var node = $(event.currentTarget);
			var attributes = this.model.get("attributes");

			switch (attributes.rel) {
				case "related":
					if (event.metaKey || event.ctrlKey) {
						event.preventDefault();

						var pmid = this.model.get("pmid");
						var currentTerm = $.trim(app.models.query.get("term"));
						var term;

						if (app.models.query.get("relatedQuery")) {
							term = currentTerm + "," + pmid;
						} else {
							term = "related:" + pmid;
						}

						app.models.query.set("term", term);
						app.views.input.$el.submit();
					}

					return;

				case "save":
					$.cookie("saveType", attributes.type, { expires: 30 });
					$("a.link.preferred-save-type").removeClass("preferred-save-type");
					$("a.link[rel=save][type='" + attributes.type + "']").addClass("preferred-save-type");
					return;

				case "store":
					var pmid = this.model.get("pmid");

					var data = {
					  "type": "http://schemas.google.com/AddActivity",
					  "target": {
					    "url": "http://pubmed.macropus.org/" + pmid
					  }
					};

					app.services.googleplus.writeMoment(data, function(result) {
						node.text(result.error ? "Error" : "Stored");
					});

				default:
					return;
			}
		}
	}),

	Pagination: Backbone.View.extend({
		tagName: "a",

		events: {
			"click": "fetchPage"
		},

        initialize: function() {
            _.bindAll(this);

            this
                .$el
                .attr("href", "#")
                .attr("rel", "next")
                .html("More &darr;")
                .data("offset", 0)
                .hide()
                .appendTo("body");
        },

        start: function() {
            this.fetchPage();
            this.watchScrollPosition(this.fetchPage, 500, 500);
        },

        watchScrollPosition: function(callback, distance, interval) {
            var $window = $(window),
                $document = $(document);

            var checkScrollPosition = function() {
                var top = $document.height() - $window.height() - distance;

                if ($window.scrollTop() >= top) {
                    callback();
                }
            };

            setInterval(checkScrollPosition, interval);
        },

		setNextOffset: function() {
			var offset = app.views.articles.offset + app.views.articles.limit;
			this.$el.data("offset", offset).removeClass("loading").html("More &darr;");
			this.$el.show();
		},

		fetchPage: function() {
			var node = this.$el;

			if (node.hasClass("loading")) {
				return false;
			}

			var spinner = $("<img/>", { src: "./images/spinner.gif"}).addClass("spinner");

			node.addClass("loading").text("Loading").append(spinner);

			app.views.articles.offset = node.data("offset");

			app.collections.articles.fetch({ add: true });

            return false;
        },

		noMoreItems: function() {
			this.$el.text("No more items");
		}
	}),

	Auth: Backbone.View.extend({
		id: "authenticate",

		events: {
			"click #sign-in": "authenticate"
		},

		initialize: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Auth(data));
			this.$el.appendTo("body");
		},

		authenticate: function(event) {
			$(event.currentTarget).hide();

			var button = $("<g:plus/>").attr({
				action: "connect",
				clientid: "257039582604.apps.googleusercontent.com",
				scope: "https://www.googleapis.com/auth/plus.moments.write",
				callback: "onSignInCallback"
			});

			button.wrap("<div class='show-when-unauthenticated'/>").parent().appendTo(this.$el);

			var scripts = [
				$("<script/>", { src: "//apis.google.com/js/client.js" }),
				$("<script/>", { src: "https://apis.google.com/js/plusone.js" }),
			];

			$("body").append(scripts);
		},

		storeAuthResult: function(result) {
			var data = result ? JSON.stringify(result) : null;
	    	$.cookie("auth", data, { expires: 7 });
		}
	}),
};