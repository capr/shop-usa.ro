
function init_status() {
	listen('usr.status', function(usr) {
		if (usr.name || usr.email) {
			$('#greeting_anonymous').hide()
			$('#greeting_logged_in').show()
			$('#greeting_name').html(firstname(usr.name, usr.email))
		} else {
			$('#greeting_logged_in').hide()
			$('#greeting_anonymous').show()
		}

		if (usr.admin)
			$('#orders_icon').show()
		else
			$('#orders_icon').hide()
	})
}

