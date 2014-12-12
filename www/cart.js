var cart = (function() {

listen('usr.cart_icon', function(usr) {
	set_cart_icon(usr.buynow_count)
})

listen('cart.cart_icon', function(cart) {
	set_cart_icon(cart.buynow ? cart.buynow.length : cart.buynow_count)
})

// computing totals ----------------------------------------------------------

function compute_totals(cart) {
	var subtotal = 0
	$.each(cart.buynow, function(i,e) { subtotal += e.price; })
	return {
		subtotal: subtotal,
		shipping: {
			home: subtotal < 300 ? 25 : 0,
			store: 0,
		}
	}
}

// cart actions --------------------------------------------------------------

function set_cart(cart) {
	broadcast('cart', cart)
}

function load_cart() {
	load_main('/cart.json', set_cart)
}

function add_prod_to_cart(pid, coid) {
	post('/cart.json/add', {pid: pid, coid: coid}, set_cart)
}

function remove_from_cart(ciid) {
	post('/cart.json/remove', {ciid: ciid}, set_cart)
}

function move_to_cart(ciid) {
	post('/cart.json/move_to_cart', {ciid: ciid}, set_cart)
}

function buy_later(ciid) {
	post('/cart.json/buy_later', {ciid: ciid}, set_cart)
}

function reorder_cart(ciids, buylater) {
	post('/cart.json/reorder', {ciids: ciids, buylater: buylater}, set_cart)
}

// cart icon -----------------------------------------------------------------

function drag_prod_img_to_cart(finish) {
	var img = $('#prod_img').clone()
		.attr('id', '')
		.css({position: 'absolute'})
		.appendTo($('#fly_img_div'))
	var srp_abs = img.parent().offset()
	var dst_abs = $('#cart_icon').offset()
	img.animate({
		top: dst_abs.top - srp_abs.top,
		left: dst_abs.left - srp_abs.left,
		width: $('#cart_icon').width(),
		height: $('#cart_icon').height(),
		opacity: 0,
	}, 500, function() {
		img.remove()
		finish()
	})
}

function set_cart_icon(n) {
	$('#cart_icon').attr('src', n > 0 && '/bag_full.png' || '/bag.png')
	$('#cart_icon_item_count').html((n < 10 ? '0' : '') + n)
}

var g_ci_top
function animate_cart_icon() {
	var ci = $('#cart_icon_div')
	g_ci_top = g_ci_top || ci.position().top - ci.offset().top
	ci.animate({top: g_ci_top - 20}, 100, 'easeOutExpo', function() {
		ci.animate({top: g_ci_top}, 500, 'easeOutBounce', function() {
			ci.css('top', '')
		})
	})
}

function add_to_cart(pid, coid) {
	if ($('#prod_img').length)
		drag_prod_img_to_cart(function() {
			add_prod_to_cart(pid, coid)
			animate_cart_icon()
		})
	else
		add_prod_to_cart(pid, coid)
}

// cart page -----------------------------------------------------------------

function update_cart_page(cart) {

	function set_sname(i,e) {
		var snames = []
		for(var i = 0; i < e.vnames.length; i++)
			snames.push(e.dnames[i] + ': <b>' + e.vnames[i] + '</b>')
		e.sname = snames.join(', ')
	}

	$.each(cart.buynow, set_sname)
	$.each(cart.buylater, set_sname)

	var totals = compute_totals(cart)

	render('cart_page', {
		buynow:         render('cart_list', cart.buynow),
		buylater:       render('cart_list', cart.buylater),
		buylater_count: cart.buylater.length,
		buynow_count:   cart.buynow.length,
		subtotal:       totals.subtotal,
		shipping:       totals.shipping.home,
		total:          totals.subtotal + totals.shipping.home,
	}, '#main')

	update_timeago()

	$('#main [ciid] a[action="remove"]').click(function() {
		var ciid = upid(this, 'ciid')
		remove_from_cart(ciid, update_cart_page)
	})

	$('#cart_buylater [ciid] a[action="move_to_cart"]').click(function() {
		var ciid = upid(this, 'ciid')
		move_to_cart(ciid, update_cart_page)
	})

	$('#cart_buynow [ciid] a[action="buy_later"]').click(function() {
		var ciid = upid(this, 'ciid')
		buy_later(ciid, update_cart_page)
	})

	$('#btn_checkout').click(function() {
		exec('/checkout')
	})

	cart_make_draggable()
}

function cart_make_draggable() {

	$('#main ul').sortable('destroy')

	var sortupdate = function() {
		var ciids = []
		var buylater = []
		$('#main ul li').each(function() {
			ciids.push(parseInt($(this).attr('ciid')))
			buylater.push($(this).closest('#cart_buylater').length > 0)
		})
		reorder_cart(ciids, buylater, update_cart_page)
	}

	$('.cart_list').sortable({
		connectWith: '.cart_list',
		placeholder:
			'<table width=100% height=100%><tr><td>'+
				S('move_here', 'Move it here')+
			'</td></tr></table>',
	}).bind('sortupdate', sortupdate)

	// sortable() makes draggable the non-li elements too...
	$('#main').find(':not(li)').attr('draggable', 'false')
}

action.cart = function() {
	hide_nav()
	listen('cart.cart_page.current_action', update_cart_page)
	listen('usr.cart_page.current_action', load_cart) // reload if user changes
	load_cart()
}

return {
	add: add_to_cart,
	totals: compute_totals,
}

})()
