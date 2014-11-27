
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

function login(auth, success, error, opt) {
	function logged_in(usr) {
		$(document).trigger('app_usr', usr)
		if (success)
			success(usr)
	}
	return ajax('/login.json', $.extend({
			success: logged_in,
			error: error,
			data: auth,
		}, opt))
}

function admin() {
	return true
}

function editmode() {
	return admin()
}

// init ----------------------------------------------------------------------

$(function() {
	init_viewstyle()
	init_letters()
	init_sidebar()

	init_status()
	init_cart()

	url_changed()
})

