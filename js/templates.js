
var Templates = {};

$(function() {
	$("[data-template]").each(function loadTemplate() {
		var template = $(this);
		Templates[template.data("template")] = Handlebars.compile(template.html());
	});
});

Handlebars.registerHelper("authorSearchComma", function(given) {
	var initials = true;

	$.each(given, function() {
		if (this.match(/[a-z]/)) initials = false;
	});

	return initials ? "" : ",";
});

Handlebars.registerHelper("pluralise", $.pluralise);