(function() {

var order_statuses = ['new', 'open', 'secured', 'shipped',
	'canceled', 'returned']

var order_item_statuses = ['new', 'secured', 'shipped',
	'canceled', 'returned', 'refunded', 'not_available']

function update_orders(orders) {

	$.each(orders.orders, function(i,o) {
		o.atime = shortdate(o.atime, 'always')
		o.opname = firstname(o.opname, o.opemail)
	})

	render('orderlist', orders, '#orders')

	$('#main [oid] a').each(function() {
		setlink(this, '/order/'+upid(this, 'oid'))
	})

	$('#main a[pid]').click(function() {
		var pid = $(this).attr('pid')
		window.open('http://6pm.com/'+pid, '_blank')
	})
}

function load_orders(q) {
	load_content('#orders', '/orderlist.json'+(q ? '/'+q : ''), function(data) {
		data.q = q
		update_orders(data)
	})
}

action.orders = function(q) {
	hide_nav()

	render('orderlist_page', {q: q}, '#main')

	var timeout
	$('#search').on('input', function() {
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(function() {
			var q = $('#search').val()
			load_orders(q)
		}, 200)
	})

	$('#search').focus().select()

	load_orders(q)
}

function update_order(o) {

	o.total = 0
	$.each(o.items, function(i,oi) {
		oi.statuses = select_map(order_item_statuses, oi.status)
		oi.canceled = oi.status == 'cancel' ? 'canceled' : null
		o.total += oi.price
	})

	o.statuses = select_map(order_statuses, o.status)
	o.address = o.shiptype == 'home'
	o.shiptype = S(o.shiptype)
	o.atime = longdate(o.atime, 'always')
	o.uname = '{0} ({0})'.format(o.uname, o.uemail)
	o.opname = firstname(o.opname, o.opemail)

	render('order', o, '#main')

	$('#main a[pid]').each(function() {
		var pid = $(this).attr('pid')
		$(this).click(function() {
			window.open('http://6pm.com/'+pid, '_blank')
		}).hover(function() {
			//
		}, function() {
			//
		}).mouseover(function() {
			//
		})
	})
}

action.order = function(oid) {
	hide_nav()
	load_main('/order.json/'+oid, update_order)
}

})()
