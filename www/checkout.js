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
	return cart.totals(g_cart, shipping_method)
}

function update_totals(totals) {
	if (!totals) return
	$('.shipping_cost').html(totals.shipping)
	$('.grand_total').html(totals.total)
}

function update_cart(cart_) {
	g_cart = cart_

	if (!g_cart.buynow.length)
		exec('/account')

	var totals = compute_totals()
	update_totals(totals)

	var data = $.extend({
		promocode:       g_cart.promocode,
		discexpires_ago: g_cart.discexpires_ago,
		items:           g_cart.buynow,
		buylater_count:  g_cart.buylater.length,
		buynow_count:    g_cart.buynow.length,
	}, totals)

	render('checkout_cart_section', data, '#cart_section')
	update_timeago()

	$('#btn_promocode').click(function() {
		var promocode = $('#promocode').val()
		cart.enter_promocode(promocode)
	})

}

// county/city autocomplete --------------------------------------------------

function update_autocomplete(g_cities) {

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

	$('#addr_county')
		.autocomplete('dispose')
		.autocomplete({lookup: counties})

	function city_changed() {
		var city = $(this).val()
		var county = county_map[city]
		if (!county) return
		$('#addr_county').val(county)
		$('#addr_county').validate()
	}

	$('#addr_city')
		.autocomplete('dispose')
		.autocomplete({lookup: all_cities, onSelect: city_changed})
		.on('input', city_changed)
}

// shipping section ----------------------------------------------------------

function update_addresses(addr) {
	var addr0 = addr.addr[0]
	if (addr0) {
		$('#addr_street').val(addr0.addr)
		$('#addr_city').val(addr0.city)
		$('#addr_county').val(addr0.county)
	} else {
		$('#addr_street').val('')
		$('#addr_city').val('')
		$('#addr_county').val('')
	}
	render('addresses', addr, '#addresses')
}

function load_addresses() {
	get('/addresses.json', update_addresses)
}

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

	get('/cities.json', update_autocomplete)
	listen('usr.checkout_page.current_action', load_addresses)
	load_addresses()
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
		email     : $('#usr_email').val(),
		name      : $('#usr_name').val(),
		phone     : $('#usr_phone').val(),
		addr      : $('#addr_street').val(),
		city      : $('#addr_city').val(),
		county    : $('#addr_county').val(),
		note      : $('#order_note').val(),
		shiptype  : $('input[name=shipping_method]:checked').val(),
	}, order_placed, order_error)

}

// main ----------------------------------------------------------------------

action.checkout = function() {
	hide_nav()
	render('checkout', null, '#main')

	listen('cart.checkout_page.current_action', update_cart)
	listen('usr.checkout_page.current_action', cart.load)

	acc = account_widget({ allow_anonymous: true })

	update_shipping_section()

	$('#btn_place_order').click(place_order)

	login() // trigger load cart
}

(function() {
  var _fbq = window._fbq || (window._fbq = []);
  if (!_fbq.loaded) {
	 var fbds = document.createElement('script');
	 fbds.async = true;
	 fbds.src = '//connect.facebook.net/en_US/fbds.js';
	 var s = document.getElementsByTagName('script')[0];
	 s.parentNode.insertBefore(fbds, s);
	 _fbq.loaded = true;
  }
})();

action.order_placed = function() {
	hide_nav()
	render('order_placed', null, '#main')

	window._fbq = window._fbq || [];
	window._fbq.push(['track', '6024267675664', {'value':'0.00','currency':'RON'}]);

}

})()
