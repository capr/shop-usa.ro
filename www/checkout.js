
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

function checkout_update_account(usr) {

	if (!usr.emailvalid && !usr.haspass)
		apply_template('#login_section_template', {}, '#account_section')
	else
		apply_template('#account_section_template', {}, '#account_section')

	$('.fa-eye').click(function() {
		$('#pass').attr('type',
			$('#pass').attr('type') == 'password' ? 'text' : 'password')
	})

	$('.btn_facebook').click(function() {
		facebook_login(function(auth) {
			post('/login.json', auth)
		}, function() {
			alert('Failed')
		})
	})

}

action.checkout = function() {
	apply_template('#checkout_template', {}, '#main')
	load_main('/cart.json', checkout_update_cart)
	//get('#account', '/login.json', checkout_update_account)
	load_content('#account', '/account.json', checkout_update_account)
}

