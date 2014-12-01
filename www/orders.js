(function() {

function update_orders(orders) {

	var statuses = ['new', 'processing', 'secured', 'shipped',
		'canceled', 'returned']

	$.each(orders.orders, function(i,o) {
		o.from_atime = shortdate(o.atime)
		o.statuses = select_map(statuses, o.status)
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

	var statuses = ['new', 'not_available', 'secured', 'shipped',
		'canceled', 'returned', 'refunded']

	$.each(order.items, function(i,oi) {
		oi.from_atime = from_shortdate(oi.atime)
		oi.statuses = select_map(statuses, oi.status)
	})

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
