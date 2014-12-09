
// UI vocabulary -------------------------------------------------------------

// ajax request on the main pane: redirect to homepage on 404.
function load_main(url, success, error, opt) {
	load_content('#main', url,
		function(data) {
			if (success)
				success(data)
			setscroll()
		},
		function(xhr) {
			check(xhr.status != 404)
			if (error)
				error(xhr)
		}, opt)
}

function hide_nav() {
	$('#sidebar').hide()
}

// init ----------------------------------------------------------------------

$(function() {
	init_viewstyle()
	init_letters()
	init_sidebar()

	init_admin()
	init_status()
	login()

	set_state_top(0) // forget scroll top on page refresh
	url_changed()
})

