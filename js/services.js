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
	this.defaults = $.extend({}, options);

	this.url = $("link[rel='service.pubmed']").attr("href");

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
		};

		return this.get("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi", { data: data });
	};

	this.history = function(data) {
		data = { total: data.Count, history: data.WebEnv + "|" + data.QueryKey };
		return this.get(this.url, { data: data });
	};
};

PubMed.prototype = new Service();

var Altmetric = function(options) {
	this.defaults = $.extend({}, options);

	var node = $("link[rel='service.altmetric']");

	this.url = node.attr("href");
	this.key = node.data("key");

	this.path = function(identifiers) {
		if (identifiers.doi) return "doi/" + identifiers.doi;
		if (identifiers.pmid) return "pmid/" + identifiers.pmid;
		return false;
	};

	this.fetch = function(path){
		var data = { key: this.key };
		return this.get(this.url + path, { data: data, queue: true });
	};

	this.parse = function(data){
		var id = encodeURIComponent(data.altmetric_id),
			items = [],
			mendeley_url;

		if (data.cited_by_blogs_count) {
			items.push({
				url: "http://altmetric.com/details.php?citation_id=" + id,
				text: this.pluralise(data.cited_by_blogs_count, "post")
			});
		}

		if (data.cited_by_tweeters_count){
			items.push({
			  url: "http://altmetric.com/details.php?citation_id=" + id,
			  text: this.pluralise(data.cited_by_tweeters_count, "tweet"),
			  domain: "twitter.com"
		  });
		}

		if (data.readers.mendeley) {
			if (data.doi) mendeley_url = "http://www.mendeley.com/openURL?id=doi:" + encodeURIComponent(data.doi);
			else if (data.pmid) mendeley_url = "http://www.mendeley.com/openURL?id=pmid:" + encodeURIComponent(data.pmid);
			else mendeley_url = "http://altmetric.com/details.php?citation_id=" + id;

			items.push({
				url: mendeley_url,
				text: this.pluralise(data.readers.mendeley, "reader"),
				domain: "mendeley.com"
			});
		}

		return items;
	};

	this.pluralise = function(count, single, plural) {
		plural = plural || single + "s";
		var suffix = count === 1 ? single : plural;
		return count.toString() + " " + suffix;
	};
};

Altmetric.prototype = new Service();
