$(function() {
	var frame = $("#external");

	window.addEventListener("message", function(event) {
		if (event.origin !== window.location.origin) {
			return;
		}

		var setURL = function() {
			frame.off("load", setURL);
			frame.attr("src", event.data.url);
		};

		frame.on("load", setURL).attr("src", "loading.html");
	}, false);

	$("#main").attr("src", "../" + location.search);
});