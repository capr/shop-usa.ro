(function() {

var order_statuses = ['new', 'processing', 'secured', 'shipped',
	'canceled', 'returned']

var order_item_statuses = ['new', 'not_available', 'secured', 'shipped',
	'canceled', 'returned', 'refunded']

function update_orders(orders) {

	$.each(orders.orders, function(i,o) {
		o.from_atime = shortdate(o.atime)
	})

	render('order_list', orders, '#main')

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

function update_order(order) {

	$.each(order.items, function(i,oi) {
		oi.from_atime = from_shortdate(oi.atime)
		oi.statuses = select_map(order_item_statuses, oi.status)
	})

	order.statuses = select_map(order_statuses, order.status)
	order.address = order.shiptype == 'home'
	order.atime = shortdate(order.atime)

	render('order', order, '#main')

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
