var Views = {
	Input: Backbone.View.extend({
		tagName: "form",

		initialize: function() {
			this.$el.appendTo("body");

			if (location.search) {
				this.parseQueryString().forEach(this.handleQueryPart, this);

				// only use "days" for "related" queries
				if (!this.model.get("relatedQuery")) {
					this.model.set("days", 0);
				}
			}

			this.render();
		},

		events: {
			"change input[type=checkbox],input[type=radio]": "submitChangedForm"
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
						filters[value] = true;
						this.model.set("filters", filters);
					}

					break;
			}
		},

		submitChangedForm: function() {
			this.$el.submit();
		}
	}),

	Info: Backbone.View.extend({
		initialize: function() {
			this.$el.appendTo("body");
			this.model.on("change", this.render, this);
		},

		render: function() {
			if (app.models.query.get("relatedQuery")) {
				return;
			}

			var data = this.model.toJSON();
			this.$el.html(Templates.Info(data));
			return this;
		},

	}),

	Articles: Backbone.View.extend({
		offset: 0,
		limit: 5,

		initialize: function() {
			this.$el.appendTo("body");
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
            this.setOffset(this.readOffsetHash())
		},

		reset: function() {
			this.$el.empty();

			this.collection.each(this.add, this);

			var articles = $("article");

			if(articles.length === 1) {
				articles.find("section").show();
				articles.find("[data-action=show-abstract]").addClass("expanded");
			}
		},

		add: function(article) {
			var view = new Views.Article({ model: article });
			this.$el.append(view.render().el);
		},

        readOffsetHash: function() {
            var matches = location.hash.match(/^#offset-(\d+)/);

            return matches ? Number(matches[1]) : 0;
        },

        setOffset: function(offset) {
            this.offset = offset;
        },

        setNextOffset: function() {
            this.setOffset(this.offset + this.limit);
            app.views.pagination.$el.removeClass("loading").html("More &darr;");
        },
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

			this.$el.find("[property=creators]").formatAuthors(5, "creator");

			this.$el.find("footer").append(this.links.$el)
			this.$el.find(".context").append(this.metrics.$el);

            this.$el.data("offset", data.offset).attr("id", "offset-" + data.offset);

			return this;
		},

		action: function(event) {
			if (event.metaKey || event.ctrlKey) {
				return true;
			}

			var node = $(event.currentTarget);

			switch (node.data("action")) {
				case "show-abstract":
					if (node.hasClass("expanded") && node.attr("property") == url) {
						return true;
					}

					node.toggleClass("expanded").closest("article").find("section").toggle();
				break;
			}

			return false;
		}
	}),

	Metrics: Backbone.View.extend({
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

		initialize: function() {
			this.collection.on("reset", this.reset, this);
			this.collection.on("add", this.add, this);
			this.reset();
		},

		reset: function() {
			this.$el.empty();
			this.collection.each(this.add, this);
		},

		add: function(link) {
			var view = new Views.Link({ model: link });
			view.$el.appendTo(this.$el);
		}
	}),

	Link: Backbone.View.extend({
		tagName: "a",
		className: "link",

		initialize: function() {
			var data = this.model.toJSON();
			this.$el.text(data.text).attr(data.attributes);
		}
	}),

	Pagination: Backbone.View.extend({
		tagName: "a",

		events: {
			"click": "fetchPage",
		},

        initialize: function() {
            _.bindAll(this);

            this
                .$el
                .attr("href", "#")
                .attr("rel", "next")
                .html("More &darr;")
                .hide()
                .appendTo("body");
        },

        start: function() {
            this.fetchPage();
            this.watchScrollPosition(this.fetchPage, 500, 500);

            if (history.pushState) {
                this.watchScrollOffset();
            }
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

        watchScrollOffset: function() {
            var $window = $(window),
                $document = $(document);

            var checkScrollOffset = function() {
                var scrollTop = $window.scrollTop();
                var windowHeight = $window.height();

                $("article").each(function() {
                    var node = $(this);
                    var offsetTop = node.offset().top;

                    if (scrollTop <= offsetTop) {
                        var offset = node.data("offset");
                        var locationOffset = app.views.articles.readOffsetHash();

                        //if (Math.abs(offset - locationOffset) > 2) {
                        if (offset !== locationOffset) {
                            history.pushState(null, null, "#offset-" + offset);
                        }

                        return false; // break
                    }
                });
            };

            setInterval(checkScrollOffset, 1000);
        },

        setOffset: function(offset) {

        },

		fetchPage: function(event) {
			var node = this.$el;

			if (node.hasClass("loading")) {
				return false;
			}

			var spinner = $("<img/>", { src: "./images/spinner.gif"}).addClass("spinner");

			node.addClass("loading").text("Loading").append(spinner)

			var result = app.collections.articles.fetch({ add: true });

            return false;
        },

		noMoreItems: function() {
			this.$el.text("No more items");
		}
	})
};