(function() {

function update_orders(orders) {

	$.each(orders.orders, function(i,o) {
		o.from_atime = shortdate(o.atime)
	})

	render('order_list', orders, '#main')

	$('#main [oid] a').each(function() {
		setlink(this, '/order/'+upid(this, 'oid'))
	})
}

action.orders = function() {
	hide_nav()
	load_main('/orderlist.json', update_orders)
}

var statuses = ['open', 'purchased', 'delivered']

function update_order(order) {

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
