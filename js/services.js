var Service = function() {};

Service.prototype.get = function(url, options) {
    options = options || {};

    var method = options.queue ? $.ajaxQueue : $.ajax;

    return method({
        url: url,
        data: $.extend({}, this.defaults, options.data),
        dataType: this.dataType,
        cache: true
    });
};

var PubMed = function(options) {
    this.base = Config.Services.PubMed;
    this.dataType = "json";

    this.defaults = $.extend({}, options);

    this.search = function(term) {
        return $.ajax({
            dataType: "xml",
            url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            data: {
                db: "pubmed",
                usehistory: "y",
                retmax: 0,
                term: term
            }
        });
    };

    this.related = function(id) {
        return $.ajax({
            dataType: "xml",
            url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi",
            data: {
                dbfrom: "pubmed",
                db: "pubmed",
                cmd: "neighbor_history",
                linkname: "pubmed_pubmed",
                id: id
            }
        });
    };

    this.buildHistoryURL = function(data) {
        return this.base + "?" + $.param({ total: data.Count, history: data.WebEnv + "|" + data.QueryKey });
    };
};

PubMed.prototype = new Service();
