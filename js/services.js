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

    this.search = function(options) {
        var _this = this;

        this.get(this.base, options).done(function(data) {
            _this.get(data.links.first).done(options.success);
        });
    };

    this.link = function(options) {
        this.get(this.base, options).done(options.success);
    };
};

PubMed.prototype = new Service();
