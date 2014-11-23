
function google_login(success, fail) {
	var params = {
		clientid: C('google_client_id'),
		scope:    'https://www.googleapis.com/auth/plus.login email',
		requestvisibleactions: 'http://schema.org/AddAction',
		cookiepolicy: 'single_host_origin',
	}
	params.callback = function(authResult) {
		console.log(authResult.status)
		if (authResult.status.signed_in) {
			post('/login.json', {
				type: 'google',
				access_token: authResult.access_token,
			}, success, fail)
		} else {
			// Possible error values:
			//   "user_signed_out" - User is signed-out
			//   "access_denied" - User denied access to your app
			//   "immediate_failed" - Could not automatically log in the user
			if (fail) fail()
		}
	}
	gapi.auth.signIn(params)
}

function google_logout() {
	gapi.auth.signOut()
}

function init_google() {
	$.getScript('https://apis.google.com/js/client:platform.js')
}

