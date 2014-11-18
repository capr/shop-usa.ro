
function facebook_check(success, fail) {
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			FB.api('/me', function(me_response) {
				success({
					type:       'facebook',
					facebookid: response.authResponse.userID,
					email:      me_response.email,
				})
			})
		} else {
			fail()
		}
	})
}

function facebook_login(success, fail) {
	FB.login(function(response) {
		if (response.authResponse) {
			FB.api('/me', function(me_response) {
				success({
					type:       'facebook',
					facebookid: response.authResponse.userID,
					email:      me_response.email,
				})
			})
		} else {
			fail()
		}
	}, {scope: 'public_profile,email'})
}

window.fbAsyncInit = function() {
	FB.init({
		appId   : '725102964211663',
		cookie  : true,  // enable cookies to allow the server to access the session
		xfbml   : true,  // parse social plugins on this page
		version : 'v2.1' // use version 2.1
	})
}

function init_facebook() {
	// load the SDK asynchronously
	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0]
		if (d.getElementById(id)) return
		js = d.createElement(s); js.id = id
		js.src = '//connect.facebook.net/en_US/sdk.js'
		fjs.parentNode.insertBefore(js, fjs)
	}(document, 'script', 'facebook-jssdk'))
}

