
var g_session
function load_session(finish) {
	get('/session.json', function(session) {
		g_session = session
		finish(session)
	})
}

function get_session(finish) {
	if (g_session)
		finish(g_session)
	else
		load_session(finish)
}

function check_login(finish) {
	get_session(function(session) {
		if (!session.uid)
			exec('/browse/login')
	})
}

