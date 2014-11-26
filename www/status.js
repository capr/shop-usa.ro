
var g_usr

function init_status() {
	function load_cart_summary(finish) {
		get('/login.json', function(usr) {
			g_usr = usr
			finish()
		})
	}

}

