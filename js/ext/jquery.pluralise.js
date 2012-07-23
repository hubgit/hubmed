(function($){
  $.pluralise = function(count, single, plural) {
    plural = plural || single + "s";
    var suffix = count === 1 ? single : plural;
    return count.toString() + " " + suffix;
  };
})(jQuery);