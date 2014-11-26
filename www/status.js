
var g_usr

function init_status() {
	get('/login.json', function(usr) {
		g_usr = usr
		$('#usr_name').html(usr.name)
		setlink('#usr_name', '/browse/account')
	})
}

