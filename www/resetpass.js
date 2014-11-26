(function() {

action.forgot_password = function() {
	hide_nav()
	apply_template('forgot_pass', {}, '#main')
	$('#email').focus()

	var validator = $('#forgot_pass_form').validate({
		messages: {
			email: {
				required: S('email_required_error',
					'We need your email to contact you'),
				email: S('email_format_error',
					'Your email must look valid'),
			},
		},
		errorPlacement: function(err, el) {
			err.appendTo($('#validation_error'))
		},
	})

	$('#btn_send_email').click(function() {
		if (!$('#forgot_pass_form').valid()) {
			validator.focusInvalid()
		} else {
			$(this).prop('disabled', true)
			$('#server_error').hide()
			post('/send_token', { email: $('#email').val() }, function() {
				exec('/browse/token_sent')
			}, function() {
				$('#btn_send_email').prop('disabled', false)
				$('#server_error').show()
			})
		}
	})
}

function apply_message_template(message_template) {
	apply_template('message', {
		message: apply_template(message_template)
	}, '#main')
}

action.token_sent = function() {
	hide_nav()
	apply_message_template('token_sent')
}

action.login = function(token) {
	if (!token) {
		exec('/browse/forgot_password')
		return
	}
	post('/login.json', {type: 'token', token: token}, function() {
		exec('/browse/reset_password')
	}, function() {
		exec('/browse/forgot_password')
	})
}

action.reset_password = function(token) {

	apply_template('reset_pass', {}, '#main')
	$('#pass').focus()

	var validator = $('#reset_pass_form').validate({
		rules: {
			pass: { minlength: 6 }
		},
		messages: {
			pass: {
				required: S('pass_required_error',
					'You need a password to sign in'),
				minlength: $.validator.format(S('pass_format_error',
					'Enter at least {0} characters')),
			},
		},
		errorPlacement: function(err, el) {
			err.appendTo($('#validation_error'))
		},
	})

	$('#btn_reset_pass').click(function() {
		if (!$('#reset_pass_form').valid()) {
			validator.focusInvalid()
		} else {
			$(this).prop('disabled', true)
			$('#server_error').hide()
			post('/reset_pass', { pass: $('#pass').val() }, function() {
				exec('/browse/password_changed')
			}, function() {
				$('#btn_reset_pass').prop('disabled', false)
				$('#server_error').show()
			})
		}
	})
}

action.password_changed = function() {
	hide_nav()
	apply_message_template('password_changed')
}

})()
