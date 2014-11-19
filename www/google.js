
function google_login(auth, successm fail) {
	var params = {
		clientid: '113821693132-an9cmghgm2fockigiubs1rp7tmfr9vnb.apps.googleusercontent.com',
		scope:    'https://www.googleapis.com/auth/plus.login',
		requestvisibleactions: 'http://schema.org/AddAction',
		cookiepolicy: 'single_host_origin',
	}
	var params.callback = function(authResult) {
		if (authResult.status.signed_in) {
			var token = authResult.access_token
			success({
				token: token,
			})
		} else {
			// Update the app to reflect a signed out user
			// Possible error values:
			//   "user_signed_out" - User is signed-out
			//   "access_denied" - User denied access to your app
			//   "immediate_failed" - Could not automatically log in the user
			console.log('Sign-in state: ' + authResult.error)
		}
	}
	gapi.auth.signIn(params)
})

function google_logout() {
	gapi.auth.signOut()
}

init_google_login() {
	//
}

