(function ($) {
  $.fn.formatAbstract = function () {
    return this.each(function () {
      var node = $(this);
      node.html(node.html().replace(/\.\s+([A-Z])/g, ".<br>$1"));
    });
  };
})(jQuery);
