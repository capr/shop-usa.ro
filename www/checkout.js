(function() {

// form validation -----------------------------------------------------------

function error_placement(error, element) {
	var div = $('.error[for="'+$(element).attr('id')+'"]')
	div.css('left', $(element).width() + 20)
	div.append(error)
	return false
}

// cart section --------------------------------------------------------------

var g_cart

function compute_totals() {
	if (!g_cart) return
	var shipping_method = $('input[name="shipping_method"]').val()
	var totals = cart.totals(g_cart)
	var subtotal = totals.subtotal
	var shipping = totals.shipping[shipping_method]
	var total = subtotal + shipping
	return {
		subtotal: subtotal,
		total: total,
		shipping: shipping,
	}
}

function update_totals(totals) {
	if (!totals) return
	$('.shipping_cost').html(totals.shipping)
	$('.grand_total').html(totals.total)
}

function update_cart(cart) {
	g_cart = cart
	var totals = compute_totals()
	update_totals(totals)

	var data = {
		items:          cart.buynow,
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		subtotal:       totals.subtotal,
	}

	render('checkout_cart_section', data, '#cart_section')
}

function load_cart() {
	load_main('/cart.json', update_cart)
}

// county/city autocomplete --------------------------------------------------

var g_cities
function update_citites(cities) {
	g_cities = cities
	update_autocomplete()
}

function update_autocomplete() {
	if(!g_cities) return
	if (!$('#addr_form').length) return

	var counties = []
	var all_cities = []
	var county_map = {} // {city: county}
	$.each(g_cities, function(county, cities) {
		counties.push(county)
		$.each(cities, function(city) {
			all_cities.push(city)
			county_map[city] = county
		})
	})
	$('#addr_county').autocomplete({lookup: counties})

	$('#addr_city').focus(function() {

		var county = $('#addr_county').val()

		var cities
		if (county in g_cities) {
			cities = []
			$.each(g_cities[county], function(city) {
				cities.push(city)
			})
		} else
			cities = all_cities

		$('#addr_city').autocomplete({
			lookup: cities,
		}).change(function() {
			var city = $(this).val()
			var county = county_map[city]
			$('#addr_county').val(county)
		})
	})

}

// shipping section ----------------------------------------------------------

var validate_addr

function update_shipping_section() {

	$('input[name="shipping_method"]').click(function() {
		update_totals(compute_totals())
		if ($(this).val() == 'home')
			$('#address_section').show()
		else
			$('#address_section').hide()
	})
	$('input[name="shipping_method"][value="home"]').click()

	var validator = $('#addr_form').validate({
		messages: {
			/*
			addr_name: {
				required: S('name_required_error',
					'We need your name to contact you'),
			},
			addr_phone: {
				required: S('phone_required_error',
					'We need your phone to contact you'),
			},
			*/
			addr_street: {
				required: S('street_required_error',
					'We need your full address'),
			},
			addr_city: {
				required: S('city_required_error',
					'We need your city'),
			},
			addr_county: {
				required: S('county_required_error',
					'We need your county'),
			},
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

	update_autocomplete()
}

// placing order -------------------------------------------------------------

function order_placed() {
	login() // to refresh the cart icon
	exec('/order_placed')
}

function order_error() {
	alert(S('order_error',
		'We failed to place the order.\nPlease try again or contact us directly.'))
}

var acc

function place_order() {

	if (!acc.validate())
		return

	if (!validate_addr())
		return

	post('/place_order.json', {
		email    : $('#usr_email').val(),
		name     : $('#usr_name').val(),
		phone    : $('#usr_phone').val(),
		addr     : $('#addr_street').val(),
		city     : $('#addr_city').val(),
		county   : $('#addr_county').val(),
		note     : $('#order_note').val(),
		shiptype : $('input[name=shipping_method]:checked').val(),
	}, order_placed, order_error)

}

// main ----------------------------------------------------------------------

action.checkout = function() {
	hide_nav()
	render('checkout', null, '#main')

	listen('usr.checkout_page.current_action', load_cart)

	acc = account_widget({ allow_anonymous: true })

	update_shipping_section()

	$('#btn_place_order').click(function() {
		place_order()
	})

	get('/cities.json', update_citites)
}

action.order_placed = function() {
	hide_nav()
	render('order_placed', null, '#main')
}

})()
