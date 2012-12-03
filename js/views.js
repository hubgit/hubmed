var Views = {
	Options: Backbone.View.extend({
		tagName: "form",

		events: {
			"change input": "handleChange"
		},

		initialize: function() {
			this.$el.appendTo("body");

			var metrics = localStorage.getItem("metrics") === "true";
			this.model.set("metrics", metrics);

			var saveType = localStorage.getItem("saveType");
			var findType = localStorage.getItem("findType");

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
				this.setAndStore("metrics", metrics);
			} else if (confirm("Enabling this will query Altmetric and Scopus for article-level metrics, and they will be able to see your search terms.")) {
				this.setAndStore("metrics", metrics);
			} else {
				event.preventDefault();
			}
		},

		setAndStore: function(name, metrics) {
			this.model.set(name, metrics);
			localStorage.setItem(name, metrics);
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
			//"click input[name=term]": "selectInput"
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
			this.links = new Views.Links({ model: this.model });
			this.metrics = new Views.Metrics({ collection: this.model.metrics });

			this.model.on("change", this.render, this);
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Article(data));

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
			"click .link": "handleClick",
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			var data = this.model.toJSON();
			this.$el.html(Templates.Links(data));
		},

		showLinks: function(event) {
			var link = $(event.target);


		},

		handleClick: function(event) {
			var node = $(event.target);

			switch (node.attr("intent")) {
				case "save":
					var type = localStorage.getItem("saveType");
					if (type) {
						this.$("[rel=save][type='" + type + "']").click();
					} else {
						node.next(".link").click();
					}
					return;

				case "find":
					var type = localStorage.getItem("findType");

					if (type) {
						this.$("[rel=find][type='" + type + "']").click();
					} else {
						node.next(".link").click();
					}
					return;
			}

			if (node.data("dropdown-target")) {
				var target = this.$(node.data("dropdown-target"));

				if (target.is(":visible")) {
					target.hide();
				} else {
					event.stopPropagation();
					var offset = node.offset();
					var previous = node.prev(".link");

					target.show();
					target.offset({ top: offset.top + node.height(), left: offset.left - previous.width() });

					var clickListener = function() {
						$(".dropdown-list:visible").hide();
						$(document).off("click", clickListener);
					};

					$(document).on("click", clickListener);
				}

				return;
			}

			switch (node.attr("rel")) {
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
					event.preventDefault();
					event.stopPropagation();
					localStorage.setItem("saveType", node.attr("type"));
					if (node.attr("download")) {
						window.location = node.attr("href");
					} else {
						window.open(node.attr("href"));
					}
					return;

				case "find":
					event.preventDefault();
					event.stopPropagation();
					localStorage.setItem("findType", node.attr("type"));
					window.open(node.attr("href"));
					return;

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

			var count = app.models.query.get("count");
			var text;
			if (count) {
				var offset = app.views.articles.offset + app.views.articles.limit + 1;
				var nextOffset = Math.min(count, offset + app.views.articles.limit);
				var text = "Loading " + offset + " - " + nextOffset + " of " + this.numberWithCommas(count) + " articles";
			} else {
				text = "Searching";
			}
			node.addClass("loading").text(text).append(spinner);

			app.views.articles.offset = node.data("offset");

			app.collections.articles.fetch({ add: true, success: this.collectionUpdated });

            return false;
        },

        numberWithCommas: function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

		noMoreItems: function() {
			this.$el.text("No more items");
		},

		collectionUpdated: function() {
			if (app.views.articles.offset == 0) {
				$(document).trigger("ZoteroItemUpdated");
			}
		}
	})
};