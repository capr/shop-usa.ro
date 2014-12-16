
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

// init ----------------------------------------------------------------------

$(function() {
	scroll_top()

	init_sidebar()
	init_newsletter()
	init_search()

	init_admin()
	init_status()
	setlinks()

	login()
	url_changed()
})

