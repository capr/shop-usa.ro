(function() {

function update_orders(orders) {

	$.each(orders.orders, function(i,o) {
		o.from_atime = from_shortdate(o.atime)
	})

	render('order_list', orders, '#main')

	$('#main [pid] a:not([action])').each(function() {
		setlink(this, '/p/'+upid(this, 'pid'))
	})
}

action.orders = function() {
	hide_nav()
	load_main('/orderlist.json', update_orders)
}

})()
