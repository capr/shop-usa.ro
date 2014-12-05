
// UI vocabulary -------------------------------------------------------------

// ajax request on the main pane: redirect to homepage on 404.
function load_main(url, success, error, opt) {
	load_content('#main', url, success,
		function(xhr) {
			check(xhr.status != 404)
			if (error)
				error(xhr)
		}, opt)
}

function hide_nav() {
	$('.navbar').hide()
	$('#sidebar').hide()
}

// session vocabulary --------------------------------------------------------

function login(auth, success, error, opt, arg) {
	function logged_in(usr) {
		broadcast('usr', usr)
		if (success)
			success(usr)
	}
	return ajax('/login.json' + (arg || ''), $.extend({
			success: logged_in,
			error: error,
			data: auth,
		}, opt))
}

function logout(success, error, opt) {
	return login(null, success, error, opt, '/logout')
}

var g_admin = false
function admin(on_change) {
	if (on_change)
		listen('usr.admin.page', on_change)
	return g_admin
}

function editmode(on_change) {
	return admin(on_change)
}

function init_admin() {
	listen('usr.admin', function(usr) {
		g_admin = usr.admin
	})
}

// init ----------------------------------------------------------------------

$(function() {
	init_viewstyle()
	init_letters()
	init_sidebar()

	init_admin()
	init_status()
	init_cart()
	login()

	url_changed()
})

