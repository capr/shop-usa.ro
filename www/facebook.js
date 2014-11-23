
function facebook_connect(success, fail) {
	FB.getLoginStatus(function(response) {
		if (response.status == 'connected')
			post('/login.json', {
				type: 'facebook',
				access_token: response.authResponse.accessToken,
			}, success, fail)
		else
			if (fail) fail()
	})
}

function facebook_login(success, fail) {
	FB.login(function(response) {
		if (response.authResponse)
			post('/login.json', {
				type: 'facebook',
				access_token: response.authResponse.accessToken,
			}, success, fail)
		else
			if (fail) fail()
	}, {scope: 'public_profile,email'})
}

function facebook_logout(success, fail) {

}

window.fbAsyncInit = function() {
	FB.init({
		appId   : C('facebook_app_id'),
		cookie  : true,  // enable cookies to allow the server to access the session
		xfbml   : true,  // parse social plugins on this page
		version : 'v2.1' // use version 2.1
	})
}

function init_facebook() {
	$.getScript('//connect.facebook.net/en_US/sdk.js')
}
