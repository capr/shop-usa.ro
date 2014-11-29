
function init_status() {
	$(document).bind('app_usr', function(e, usr) {
		if (usr && (usr.name || usr.email)) {
			$('#greeting_anonymous').hide()
			$('#greeting_logged_in').show()
			$('#greeting_name').html(firstname(usr.name, usr.email))
			setlink('#greeting_name', '/account')
		} else {
			$('#greeting_logged_in').hide()
			$('#greeting_anonymous').show()
			setlink('#greeting_anonymous', '/account')
		}
	})
}

