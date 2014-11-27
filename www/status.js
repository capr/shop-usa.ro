
function init_status() {
	get('/login.json', function(usr) {
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
}

function admin() {
	return true
}

function editmode() {
	return admin()
}
