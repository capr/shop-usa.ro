
function init_status() {
	$(document).bind('app_usr', function(e, usr) {
		if (usr.name) {
			$('#greeting_anonymous').hide()
			$('#greeting_logged_in').show()
			$('#usr_name').html(firstname(usr.name))
			setlink('#usr_name', '/account')
		} else {
			$('#greeting_logged_in').hide()
			$('#greeting_anonymous').show()
			setlink('#greeting_anonymous', '/account')
		}
	})
	login()
}

