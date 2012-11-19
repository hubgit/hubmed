var onSignInCallback = function(data) {
 	if (data.error != null) {
 		if (data.error = "immediate_failed") {
 			return;
 		}

 		alert("There was a problem signing in!");
 		return;
 	}

 	app.services.googleplus.authResult = data;

    $(".show-when-unauthenticated").hide(function() {
  	    $(".show-when-authenticated").show(); // features that require the user to be signed in
    });
}
