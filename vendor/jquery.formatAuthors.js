(function ($) {
  $.fn.formatAuthors = function (max, property) {
    return this.each(function () {
      var et;
      var node = $(this);
      var authors = node.find("[property=" + property + "]");

      if (authors.length > max) {
        authors.slice(max - 2, -2).wrap("<span class='hidden'></span>");

        et = $("<a/>", { href: "#" }).addClass("et-al").text(" et al.").appendTo(node);

        et.click(function (event) {
          event.preventDefault();
          event.stopPropagation();
          $(this).hide().parent().find(".hidden [property=" + property + "]").unwrap();
        });
      }

      var comma = document.createTextNode(", ");
      authors.not(":last").after(comma);

      authors.each(function() {
        var node = $(this);
        var name = node.text();

        // build a different search term if only initials are available
        var matches = name.match(/^([A-Z ]+) (.+)/);
        if (matches) {
          name = matches[2] + " " + matches[1].replace(/\s/g, "");
        }

        var query = $.param({ term: name + "[Author]" });
        var link = $("<a/>", { href: "./?" + query });
        node.wrapInner(link);
      });

    });
  };
})(jQuery);
