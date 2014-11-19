
function facebook_get_me(auth, success) {
	FB.api('/me', function(me) {
		success({
			type:        'facebook',
			accesstoken: auth.accessToken,
			facebookid:  auth.userID,
			email:       me.email,
			firstname:   me.first_name,
			lastname:    me.last_name,
			gender:      me.gender,
		})
	})
}

function facebook_connect(success) {
	FB.getLoginStatus(function(response) {
		if (response.status == 'connected')
			facebook_get_me(response.authResponse, success)
	})
}

function facebook_login(success, fail) {
	FB.login(function(response) {
		if (response.authResponse)
			facebook_get_me(response.authResponse, success)
		else
			if (fail) fail()
	}, {scope: 'public_profile,email'})
}

window.fbAsyncInit = function() {
	FB.init({
		appId   : '725102964211663',
		cookie  : true,  // enable cookies to allow the server to access the session
		xfbml   : true,  // parse social plugins on this page
		version : 'v2.1' // use version 2.1
	})
	facebook_connect(function(auth) {
		post('/login.json', auth)
	})
}

function init_facebook() {
	$.getScript('//connect.facebook.net/en_US/sdk.js')
	/*
	// load the SDK asynchronously
	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0]
		if (d.getElementById(id)) return
		js = d.createElement(s); js.id = id
		js.src = '//connect.facebook.net/en_US/sdk.js'
		fjs.parentNode.insertBefore(js, fjs)
	}(document, 'script', 'facebook-jssdk'))
	*/
}

