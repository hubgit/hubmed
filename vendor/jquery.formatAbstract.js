(function ($) {
  $.fn.formatAbstract = function () {
    return this.each(function () {
      var node = $(this);
      node.html("<span>" + node.html().replace(/\.\s+([A-Z])/g, ".</span><span>$1") + "</span>");
    });
  };
})(jQuery);
