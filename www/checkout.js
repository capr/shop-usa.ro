
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
	var a = $('#account_section')
	a.css({position: 'relative'})
	a.animate({top: 0}, // just because it won't start otherwise
		{
			duration: 400,
			progress: function(_,t) {
				a.css('left', 30 * (1-t) * Math.sin(t * Math.PI * 6))
		},
	})
}

var want_anonymous = false

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
		want_anonymous = true
		post('/login.json', {type: 'anonymous'}, action.checkout)
	})

	$('#email').keypress(function(e) {
		if(e.keyCode == 13)
			$('#pass').focus()
	})

	$('#pass').keypress(function(e) {
		if(e.keyCode == 13)
			$('#btn_login').click()
	})

	var pass_auth = function(action) {
		return {
			type:  'pass',
			action: action,
			email:  $('#email').val(),
			pass:   $('#pass').val(),
		}
	}

	var validator = $('#login_form').validate({
		rules: {
			pass: { minlength: 6 }
		},
		messages: {
			email: {
				required: S('email_required_error',
					'We need your email to contact you'),
				email: S('email_format_error',
					'Your email must look valid'),
			},
			pass: {
				required: S('pass_required_error',
					'You need a password to sign in'),
				minlength: $.validator.format(S('pass_format_error',
					'Enter at least {0} characters')),
			},
		},
		errorPlacement: function(error, element) {
			var div = $('.error[for="'+$(element).attr('id')+'"]')
			div.css('left', $(element).width() + 20)
			div.append(error)
			return false
		},
	})
	var validate = function() {
		if (!$('#login_form').valid()) {
			validator.focusInvalid()
			login_failed()
			return false
		}
		return true
	}

	$('#btn_login').click(function() {
		if (validate())
			post('/login.json', pass_auth('login'), action.checkout, login_failed)
	})

	$('#btn_create_account').click(function() {
		if (validate())
			post('/login.json', pass_auth('create'), action.checkout, login_failed)
	})

}

function checkout_update_account(usr) {

	if (usr.anonymous && !want_anonymous) {
		create_login_section('#account_section')
	} else {
		apply_template('#account_section_template', usr, '#account_section')
	}

	$('#relogin').click(function() {
		facebook_logout()
		google_logout()
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

