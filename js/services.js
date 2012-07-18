var Service = function() {};

Service.prototype.get = function(url, options) {
    options = options || {};

    var method = options.queue ? $.ajaxQueue : $.ajax;

    return method({
        url: url,
        data: $.extend({}, this.defaults, options.data),
        cache: true
    });
};

var PubMed = function(options) {
    this.base = Config.Services.PubMed;

    this.defaults = $.extend({}, options);

    this.search = function(term) {
        var data = {
            db: "pubmed",
            usehistory: "y",
            retmax: 0,
            term: term
        };

        return this.get("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", { data: data });
    };

    this.related = function(id) {
        var data = {
            dbfrom: "pubmed",
            db: "pubmed",
            cmd: "neighbor_history",
            linkname: "pubmed_pubmed",
            id: id
        }

        return this.get("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi", { data: data });
    };

    this.buildHistoryURL = function(data) {
        return this.base + "?" + $.param({ total: data.Count, history: data.WebEnv + "|" + data.QueryKey });
    };
};

PubMed.prototype = new Service();
