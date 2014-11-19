
function google_login(success, fail) {
	var params = {
		clientid: '113821693132-an9cmghgm2fockigiubs1rp7tmfr9vnb.apps.googleusercontent.com',
		scope:    'https://www.googleapis.com/auth/plus.login',
		requestvisibleactions: 'http://schema.org/AddAction',
		cookiepolicy: 'single_host_origin',
	}
	params.callback = function(authResult) {
		console.log(authResult)
		if (authResult.status.signed_in) {
			gapi.client.load('plus','v1', function() {
				gapi.client.plus.people.get({userId: 'me'}).execute(function(resp) {
					console.log(resp)
					success({
						type:        'google',
						accesstoken: authResult.access_token,
						code:        authResult.code,
					})
				})
			})
		} else {
			// Update the app to reflect a signed out user
			// Possible error values:
			//   "user_signed_out" - User is signed-out
			//   "access_denied" - User denied access to your app
			//   "immediate_failed" - Could not automatically log in the user
			fail()
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

