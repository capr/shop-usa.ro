
// account({section: selector, allow_anonymous: true|false}) -> account
// account.load(success)
// account.validate() -> true | nothing
function account(acc) {

	var want_anonymous = false

	// form validation --------------------------------------------------------

	function error_placement(error, element) {
		var div = $('.error[for="'+$(element).attr('id')+'"]')
		div.css('left', $(element).width() + 20)
		div.append(error)
		return false
	}

	// login section ----------------------------------------------------------

	function login_failed() {
		var a = $(acc.section)
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


	function logged_in(usr) {
		//$(document).trigger('app-usr', usr)
	}

	var validate_login

	function create_login_section() {

		render('account_login', {}, acc.section)

		$('.fa-eye').click(function() {
			$('#pass').attr('type',
				$('#pass').attr('type') == 'password' ? 'text' : 'password')
		})

		$('#btn_facebook').click(function() {
			facebook_login(logged_in, login_failed)
		})

		$('#btn_google').click(function() {
			google_login(logged_in, login_failed)
		})

		$('#btn_no_account').click(function() {
			want_anonymous = true
			post('/login.json', {type: 'anonymous'}, logged_in)
		})

		if (!acc.allow_anonymous)
			$('#btn_no_account').hide()

		setlink('#btn_forgot_pass', '/forgot_password')

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
				post('/login.json', pass_auth('login'), logged_in, login_failed)
			}
		})

		$('#btn_create_account').click(function() {
			if (validate_login()) {
				$(this).prop('disabled', true)
				post('/login.json', pass_auth('create'), logged_in, login_failed)
			}
		})

		$(document).trigger('app-usr', null)

	}

	// user section --------------------------------------------------------------

	var usr
	var validate_usr

	function create_user_section() {
		render('account_info', usr, acc.section)

		$('#relogin').click(function() {
			create_login_section()
		})

		setlink('#reset_pass', '/reset_password')

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

		$(document).trigger('app-usr', usr)
	}

	// account ----------------------------------------------------------------

	acc.load = function(success) {
		load_content(acc.section, '/login.json', function(usr_) {
			usr = usr_

			if (usr.anonymous && !want_anonymous)
				create_login_section()
			else
				create_user_section()

			if (success)
				success()
		})
	}

	acc.validate = function() {

		if ($('#login_form').length) {
			if (!validate_login())
				return
			$('#email').focus() // login form validates but we're not logged in
			return
		}

		if ($('#usr_form').length)
			if (!validate_usr())
				return

		return {
			email: $('#email').val(),
			name:  $('#name').val(),
			phone: $('#phone').val(),
		}
	}

	return acc

}

action.account = function() {

	render('account', null, '#main')

	var acc = account({
		section: '#account_section',
		allow_anonymous: false,
	})

	acc.load()

}

