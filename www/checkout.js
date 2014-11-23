(function() {

// form validation -----------------------------------------------------------

function error_placement(error, element) {
	var div = $('.error[for="'+$(element).attr('id')+'"]')
	div.css('left', $(element).width() + 20)
	div.append(error)
	return false
}

// totals --------------------------------------------------------------------

var g_shipping_cost
var g_subtotal

function update_totals() {
	var total = g_subtotal + g_shipping_cost
	$('.shipping_cost').html(g_shipping_cost)
	$('.grand_total').html(total)
}

// cart section --------------------------------------------------------------

function update_cart(cart) {

	var total = 0
	$.each(cart.buynow, function(i,e) { total += e.price; })
	g_subtotal = total
	update_totals()

	var data = {
		items:          cart.buynow,
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		total:          total,
	}

	apply_template('#checkout_cart_section_template', data, '#cart_section')

}

function load_cart() {
	load_main('/cart.json', update_cart)
}

// login section -------------------------------------------------------------

function login_failed() {
	var a = $('#account_section')
	a.css({position: 'relative'})
	// note: top: 0 is just beacause the animation won't start with no attrs.
	a.animate({top: 0}, {
		duration: 400,
		progress: function(_,t) {
			a.css('left', 30 * (1-t) * Math.sin(t * Math.PI * 6))
		},
	})
}

var g_want_anonymous = false

var validate_login

function create_login_section() {

	apply_template('#login_section_template', {}, '#account_section')

	g_want_anonymous = false

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
		g_want_anonymous = true
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

	function pass_auth(action) {
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
		errorPlacement: error_placement,
	})

	validate_login = function() {
		if (!$('#login_form').valid()) {
			validator.focusInvalid()
			login_failed()
			return false
		}
		return true
	}

	$('#btn_login').click(function() {
		if (validate_login())
			post('/login.json', pass_auth('login'), action.checkout, login_failed)
	})

	$('#btn_create_account').click(function() {
		if (validate_login())
			post('/login.json', pass_auth('create'), action.checkout, login_failed)
	})

}

// user section --------------------------------------------------------------

var validate_usr

function create_user_section(usr) {
	apply_template('#user_section_template', usr, '#account_section')

	$('#relogin').click(function() {
		create_login_section()
	})

	var validator = $('#usr_form').validate({
		rules: {

		},
		messages: {

		},
		errorPlacement: error_placement,
	})

	validate_usr = function() {
		if (!$('#usr_form').valid()) {
			validator.focusInvalid()
			return false
		}
		return true
	}

}

// shipping section ----------------------------------------------------------

var validate_addr

function update_shipping_section() {

	$('input[name="shipping_method"]').click(function() {
		var home = $(this).val() == 'home'
		g_shipping_cost = home ? 25 : 0
		update_totals()
		if (home)
			$('#address_section').show()
		else
			$('#address_section').hide()
	})
	$('input[name="shipping_method"][value="home"]').trigger('click')

	var validator = $('#addr_form').validate({
		rules: {
		},
		messages: {
			required: S('field_required', 'You need to enter this'),
		},
		errorPlacement: error_placement,
	})

	validate_addr = function() {
		if (!$('#address_section').is(":visible"))
			return true
		if (!$('#addr_form').valid()) {
			validator.focusInvalid()
			return false
		}
		return true
	}
}

// ordering ------------------------------------------------------------------

function create_order() {

	if ($('#login_form').length) {
		if (!validate_login())
			return
		$('#email').focus()
		return
	}

	if ($('#usr_form').length)
		if (!validate_usr())
			return

	if (!validate_addr())
		return

}

// main ----------------------------------------------------------------------

action.checkout = function() {

	apply_template('#checkout_template', {}, '#main')

	load_content('#account_section', '/login.json', function(usr) {
		if (usr.anonymous && !g_want_anonymous)
			create_login_section()
		else
			create_user_section(usr)
		load_cart()
	})

	update_shipping_section()

	$('.orderbutton').click(function() {
		create_order()
	})

}

})()
