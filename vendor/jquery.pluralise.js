(function($){
	var numberWithCommas = function(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	$.pluralise = function(count, single, plural) {
		plural = plural || single + "s";
		var suffix = Number(count) === 1 ? single : plural;
		return numberWithCommas(count) + " " + suffix;
	};
})(jQuery);