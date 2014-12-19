
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

function init_homepage() {

	$('.banner').unslider({
		speed: 1500,
		delay: 5000,
		keys: false,
		dots: true,
		fluid: false
	})

}

function check_homepage() {
	if (location.pathname == '/')
		$('#homepage').show()
	else
		$('#homepage').hide()
}

$(function() {
	scroll_top()

	init_homepage()
	init_sidebar()
	init_newsletter()
	init_search()

	init_admin()
	init_status()
	setlinks()

	login()
	url_changed()
})

