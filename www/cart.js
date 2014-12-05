
// cart/actions --------------------------------------------------------------

var g_cart
function set_cart(cart) {
	g_cart = cart
	broadcast('cart.buynow_count', cart.buynow ? cart.buynow.length : cart.buynow_count)
}

function add_prod_to_cart(pid, coid, finish) {
	var args = {pid: pid, coid: coid}
	post('/cart.json/add', args, function(cart) {
		set_cart(cart)
		finish()
	})
}

function remove_from_cart(ciid, finish) {
	var args = {ciid: ciid}
	post('/cart.json/remove', args, function(cart) {
		set_cart(cart)
		finish()
	})
}

function move_to_cart(ciid, finish) {
	var args = {ciid: ciid}
	post('/cart.json/move_to_cart', args, function(cart) {
		set_cart(cart)
		finish()
	})
}

function buy_later(ciid, finish) {
	var args = {ciid: ciid}
	post('/cart.json/buy_later', args, function(cart) {
		set_cart(cart)
		finish()
	})
}

function cart_reorder(ciids, buylater, finish) {
	var args = {ciids: ciids, buylater: buylater}
	post('/cart.json/reorder', args, function(cart) {
		set_cart(cart)
		finish()
	})
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
	$('#cart_icon').click(function() {
		exec('/cart')
	})
}

var g_ci_top
function update_cart_icon() {
	var ci = $('#cart_icon_div')
	g_ci_top = g_ci_top || ci.position().top - ci.offset().top
	ci.animate({top: g_ci_top - 20}, 100, 'easeOutExpo', function() {
		ci.animate({top: g_ci_top}, 500, 'easeOutBounce', function() {
			ci.css('top', '')
		})
	})
}

function add_to_cart(pid, coid) {
	drag_prod_img_to_cart(function() {
		add_prod_to_cart(pid, coid, update_cart_icon)
	})
}

function init_cart() {
	listen('usr.cart', function(usr) {
		set_cart_icon(usr.buynow_count)
	})
	listen('cart.buynow_count', function(buynow_count) {
		set_cart_icon(buynow_count)
	})
}

// cart page -----------------------------------------------------------------

function update_cart_page() {

	var total = 0
	$.each(g_cart.buynow, function(i,e) { total += e.price; })

	function set_sname(i,e) {
		var snames = []
		for(var i = 0; i < e.vnames.length; i++)
			snames.push(e.dnames[i] + ': <b>' + e.vnames[i] + '</b>')
		e.sname = snames.join(', ')
	}

	$.each(g_cart.buynow, set_sname)
	$.each(g_cart.buylater, set_sname)

	render('cart_page', {
		buynow:         render('cart_list', g_cart.buynow),
		buylater:       render('cart_list', g_cart.buylater),
		buylater_count: g_cart.buylater.length,
		buynow_count:   g_cart.buynow.length,
		total:          total,
	}, '#main')

	update_timeago()

	$('#main [pid] a:not([action])').each(function() {
		setlink(this, '/p/'+upid(this, 'pid'))
	})

	$('#main [pid] a[action="remove"]').click(function() {
		var ciid = upid(this, 'ciid')
		remove_from_cart(ciid, update_cart_page)
	})

	$('#cart_buylater [pid] a[action="move_to_cart"]').click(function() {
		var ciid = upid(this, 'ciid')
		move_to_cart(ciid, update_cart_page)
	})

	$('#cart_buynow [pid] a[action="buy_later"]').click(function() {
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
		cart_reorder(ciids, buylater, update_cart_page)
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
	load_main('/cart.json', function(cart) {
		set_cart(cart)
		update_cart_page()
	})
}

