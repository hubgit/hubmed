$(function() {
	var frame = $("#external");
	var main = $("#main");

	window.addEventListener("message", function(event) {
		if (event.origin !== window.location.origin) {
			return;
		}

		frame.attr("src", event.data.url);
		return;

		var setURL = function() {
			frame.off("load", setURL);
			frame.attr("src", event.data.url);
		};

		frame.on("load", setURL).attr("src", "loading.html");
	}, false);

	main.on("load", function(event) {
		var search = event.target.contentWindow.location.search;
		// TODO: keep the parent iframe URL in sync
	});

	main.attr("src", "../" + location.search);
});