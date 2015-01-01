var Models = {
    Query: Backbone.Model.extend({
        defaults: {
            "filters":  {
                "free full text[filter]": {
                    name: "free full text",
                    enabled: false
                },
                "review[ptyp]": {
                    name: "review",
                    enabled: false
                }
            },
            "days": 0,
            "term": ""
        }
    }),

    Article: Backbone.Model.extend({
        augmentors: {
            metrics: {
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
            data: {
                oa: function() {
                    var model = this,
                        service = app.services.oa,
                        oa = this.get("oa"),
                        pmid = this.get("pmid");

                    if(oa) return;

                    service.fetch(pmid).done(function(data) {
                        var item = service.parse(data);
                        if(item) model.set("oa", item.url);
                    });
                },

                doi: function() {
                    var model = this,
                        service = app.services.doi,
                        doi = this.get("doi");

                    if(!doi) return;

                    service.fetch(doi).done(function(data) {
                        var item = service.parse(data);
                        if(item) model.set("url", item.url);
                    });
                }
            }
        },

        initialize: function() {
            this.metrics = new Collections.Metrics();

            var model = this;
            $.each(this.augmentors.data, function(name, augmentor) {
                augmentor.call(model);
            });

            if (app.models.options.get("metrics")) {
                $.each(this.augmentors.metrics, function(name, augmentor) {
                    augmentor.call(model);
                });
            }
        }
    }),

    Info: Backbone.Model.extend({}),
    Options: Backbone.Model.extend({})
};
