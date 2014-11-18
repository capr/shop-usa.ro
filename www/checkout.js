
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
					alert('Login failed')
			})
		}, function() {
			alert('Failed')
		})
	})
}

function checkout_update_account(usr) {

	if (!usr.emailvalid == 1 && !usr.haspass)
		create_login_section('#account_section')
	else
		apply_template('#account_section_template', usr, '#account_section')

	$('#relogin').click(function() {
		create_login_section('#account_section')
	})

}

action.checkout = function() {
	apply_template('#checkout_template', {}, '#main')
	load_main('/cart.json', checkout_update_cart)
	//get('#account', '/login.json', checkout_update_account)
	load_content('#account', '/account.json', checkout_update_account)
}

