
function checkout_update_cart(cart) {

	var total = 0
	$.each(cart.buynow, function(i,e) { total += e.price; })
	total = total.toFixed(2)

	var data = {
		items:          cart.buynow,
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		total:          total,
	}

	apply_template('#checkout_cart_section_template', data, '#cart_section')
}

function create_login_section(dst_id) {
	apply_template('#login_section_template', {}, dst_id)

	$('.fa-eye').click(function() {
		$('#pass').attr('type',
			$('#pass').attr('type') == 'password' ? 'text' : 'password')
	})

	$('.btn_facebook').click(function() {
		facebook_login(function(auth) {
			post('/login.json', auth, function(status) {
				if (status.success)
					action.checkout()
				else
					alert(S('login_failed', 'Login Failed'))
			})
		}, function() {
			alert(S('login_failed', 'Login Failed'))
		})
	})

	$('.btn_google').click(function() {
		google_login(function(auth) {
			console.log('google_login: ', auth)
			/*
			post('/login.json', auth, function(status) {
				if (status.success)
					action.checkout()
				else
					alert(S('login_failed', 'Login Failed'))
			})
			*/
		}, function() {
			//alert(S('login_failed', 'Login Failed'))
		})
	})

	var pass_auth = function(action) {
		return {
			type:  'pass',
			action: action,
			email:  $('#email').val(),
			pass:   $('#pass').val(),
		}
	}

	$('#btn_login').click(function() {
		var auth =
		post('/login.json', pass_auth('login'), function(status) {
			if (status.success) {
				action.checkout()
			} else {
				alert(S('login_failed', 'Login Failed'))
			}
		})
	})

	$('#btn_create_account').click(function() {
		post('/login.json', pass_auth('create'), function(status) {
			if (status.success) {
				action.checkout()
			} else {
				alert(S('login_failed', 'Login Failed'))
			}
		})
	})

}

function checkout_update_account(usr) {

	if (usr.anonymous) {
		create_login_section('#account_section')
	} else {
		apply_template('#account_section_template', usr, '#account_section')
	}

	$('#relogin').click(function() {
		create_login_section('#account_section')
	})

}

action.checkout = function() {
	apply_template('#checkout_template', {}, '#main')
	load_main('/cart.json', checkout_update_cart)
	load_content('#account', '/login.json', checkout_update_account)
}

