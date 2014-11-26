
// form validation -----------------------------------------------------------

function error_placement(error, element) {
	var div = $('.error[for="'+$(element).attr('id')+'"]')
	div.css('left', $(element).width() + 20)
	div.append(error)
	return false
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
	$('#btn_login').prop('disabled', false)
	$('#btn_create_account').prop('disabled', false)
}

var g_want_anonymous = false

var validate_login

function create_login_section() {

	apply_template('login_section', {}, '#account_section')

	g_want_anonymous = false

	$('.fa-eye').click(function() {
		$('#pass').attr('type',
			$('#pass').attr('type') == 'password' ? 'text' : 'password')
	})

	$('#btn_facebook').click(function() {
		facebook_login(action.checkout, login_failed)
	})

	$('#btn_google').click(function() {
		google_login(action.checkout, login_failed)
	})

	$('#btn_no_account').click(function() {
		g_want_anonymous = true
		post('/login.json', {type: 'anonymous'}, action.checkout)
	})

	setlink('#btn_forgot_pass', '/browse/forgot_password')

	$('#email').keypress(function(e) {
		if(e.keyCode == 13)
			$('#pass').focus()
	})

	$('#pass').keypress(function(e) {
		if(e.keyCode == 13)
			$('#btn_login').click()
	})

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

	function pass_auth(action) {
		return {
			type:  'pass',
			action: action,
			email:  $('#email').val(),
			pass:   $('#pass').val(),
		}
	}

	$('#btn_login').prop('disbled', false).click(function() {
		if (validate_login()) {
			$(this).prop('disabled', true)
			post('/login.json', pass_auth('login'), action.checkout, login_failed)
		}
	})

	$('#btn_create_account').click(function() {
		if (validate_login()) {
			$(this).prop('disabled', true)
			post('/login.json', pass_auth('create'), action.checkout, login_failed)
		}
	})

}

// user section --------------------------------------------------------------

var validate_usr

function create_user_section(usr) {
	apply_template('user_section', usr, '#account_section')

	$('#relogin').click(function() {
		create_login_section()
	})

	setlink('#reset_pass', '/browse/reset_password')

	var validator = $('#usr_form').validate({
		messages: {
			usr_email: {
				required: S('email_required_error',
					'We need your email to contact you'),
				email: S('email_format_error',
					'Your email must look valid'),
			},
			usr_name: {
				required: S('name_required_error',
					'We need your name to contact you'),
			},
			usr_phone: {
				required: S('phone_required_error',
					'We need your phone to contact you'),
			},
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

// account -------------------------------------------------------------------

function load_account(dst_id, success)
	load_content(dst_id, '/login.json', function(usr) {
		if (usr.anonymous && !g_want_anonymous)
			create_login_section()
		else
			create_user_section(usr)
		if (success) success()
	})
}

