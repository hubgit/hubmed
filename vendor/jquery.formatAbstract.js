(function ($) {
  $.fn.formatAbstract = function () {
    return this.each(function () {
      var node = $(this);
      node.html("<div>" + node.html().replace(/\.\s+([A-Z])/g, ".</div><div>$1") + "</div>");
    });
  };
})(jQuery);
