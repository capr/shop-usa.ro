
function facebook_status_changed(response) {
	console.log('facebook_status_changed', response)
	if (response.status === 'connected') {
		facebook_login_success(response)
	} else if (response.status === 'not_authorized') {
		facebook_login_fail(response)
	} else {
		facebook_login_fail(response)
	}
}

// as specified in <fb:login-button onlogin="...">
function facebook_checklogin() {
	FB.getLoginStatus(function(response) {
		facebook_status_changed(response)
	})
}

window.fbAsyncInit = function() {
	FB.init({
		appId      : '725102964211663',
		cookie     : true,  // enable cookies to allow the server to access the session
		xfbml      : true,  // parse social plugins on this page
		version    : 'v2.1' // use version 2.1
	})
	FB.getLoginStatus(function(response) {
		facebook_status_changed(response)
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

function facebook_login_success(response) {
	FB.api('/me', function(response) {
		console.log('/me', response)
	})
}

function facebook_login_fail(response) {
	//
}

init_facebook()
