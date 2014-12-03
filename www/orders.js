(function() {

var order_statuses = ['new', 'open', 'secured', 'shipped',
	'canceled', 'returned']

var order_item_statuses = ['new', 'secured', 'shipped',
	'canceled', 'returned', 'refunded', 'not_available']

function update_orders(orders) {

	$.each(orders.orders, function(i,o) {
		o.from_atime = shortdate(o.atime)
		o.opname = firstname(o.opname, o.opemail)
	})

	render('order_page', orders, '#main')

	$('#main [oid] a').each(function() {
		setlink(this, '/order/'+upid(this, 'oid'))
	})

	$('#main a[pid]').click(function() {
		var pid = $(this).attr('pid')
		window.open('http://6pm.com/'+pid, '_blank')
	})
}

action.orders = function() {
	hide_nav()
	load_main('/orderlist.json', update_orders)
}

function update_order(o) {

	o.total = 0
	$.each(o.items, function(i,oi) {
		oi.statuses = select_map(order_item_statuses, oi.status)
		o.total += oi.price
	})

	o.statuses = select_map(order_statuses, o.status)
	o.address = o.shiptype == 'home'
	o.atime = shortdate(o.atime)
	o.opname = firstname(o.opname, o.opemail)

	render('order', o, '#main')

	$('#main a[pid]').click(function() {
		var pid = $(this).attr('pid')
		window.open('http://6pm.com/'+pid, '_blank')
	})
}

action.order = function(oid) {
	hide_nav()
	load_main('/order.json/'+oid, update_order)
}

})()
