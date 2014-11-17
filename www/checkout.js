
function update_checkout_page(cart) {

	var total = 0
	$.each(cart.buynow, function(i,e) { total += e.price; })
	total = total.toFixed(2)

	var data = {
		items:          cart.buynow,
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		total:          total,
	}

	apply_template('#checkout_template', data, '#main')
}

action.checkout = function() {
	load_main('/cart.json', update_checkout_page)
}

