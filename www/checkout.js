
var g_shipping_cost
var g_subtotal
function checkout_update_totals() {
	var total = g_subtotal + g_shipping_cost
	$('.shipping_cost').html(g_shipping_cost)
	$('.grand_total').html(total)
}

function checkout_update_cart(cart) {

	var total = 0
	$.each(cart.buynow, function(i,e) { total += e.price; })
	g_subtotal = total
	checkout_update_totals()

	var data = {
		items:          cart.buynow,
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		total:          total,
	}

	apply_template('#checkout_cart_section_template', data, '#cart_section')

}

function login_failed() {
	alert(S('login_failed', 'Login Failed'))
}

function create_login_section(dst_id) {
	apply_template('#login_section_template', {}, dst_id)

	$('.fa-eye').click(function() {
		$('#pass').attr('type',
			$('#pass').attr('type') == 'password' ? 'text' : 'password')
	})

	$('.btn_facebook').click(function() {
		facebook_login(action.checkout, login_failed)
	})

	$('.btn_google').click(function() {
		google_login(action.checkout, login_failed)
	})

	$('.btn_no_account').click(function() {
		get('/login.json', action.checkout)
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
		post('/login.json', pass_auth('login'), action.checkout, login_failed)
	})

	$('#btn_create_account').click(function() {
		post('/login.json', pass_auth('create'), action.checkout, login_failed)
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

	load_main('/cart.json', checkout_update_cart)

}

action.checkout = function() {

	apply_template('#checkout_template', {}, '#main')

	$('input[name="delivery_method"]').click(function() {
		var home = $(this).val() == 'home'
		g_shipping_cost = home ? 25 : 0
		checkout_update_totals()
		if (home)
			$('#address_section').show()
		else
			$('#address_section').hide()
	})
	$('input[name="delivery_method"][value="home"]').trigger('click')

	load_content('#account', '/login.json', checkout_update_account)

	$('#addr_form').validate({
		debug: true,
		submitHandler: function() {
			console.log('submit')
		}
	})

	$('.orderbutton').click(function() {

		$('#addr_form').submit()

	})

}

