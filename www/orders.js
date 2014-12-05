var orders = (function() {

var statuses = ['new', 'open', 'secured', 'shipped',
	'canceled', 'returned']

var item_statuses = ['new', 'secured', 'shipped',
	'canceled', 'returned', 'refunded', 'not_available']

var shiptypes = ['home', 'store']

// order actions -------------------------------------------------------------

function set_order(o) {
	broadcast('order', o)
}

function add_to_order(oid, coid) {
	post('/order.json/'+oid+'/add', {coid: coid}, set_order)
}

function load_order(oid) {
	load_main('/order.json/'+oid, set_order)
}

function update_order(oid, data) {
	post('/order.json/'+oid+'/update', data, function(o) {
		set_order(o)
		broadcast('open_orders')
		notify(S('changes_saved', 'Changes saved'))
	})
}

// order list page -----------------------------------------------------------

function update_orders(data) {

	$.each(data.orders, function(i,o) {
		o.atime = shortdate(o.atime, 'always')
		o.opname = firstname(o.opname, o.opemail)
	})

	render('orderlist', data, '#orders')

	$('#main [oid] a').each(function() {
		setlink(this, '/order/'+upid(this, 'oid'))
	})

	$('#main a[pid]').click(function() {
		var pid = $(this).attr('pid')
		window.open('http://6pm.com/'+pid, '_blank')
	})
}

function load_orders(q) {
	var url = '/orderlist.json/all/' + (q || '')
	load_content('#orders', url, function(data) {
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

// order page ----------------------------------------------------------------

function update_order_page(o) {

	o.total = 0
	$.each(o.items, function(i,oi) {
		oi.statuses = select_map(item_statuses, oi.status)
		oi.canceled = oi.status == 'cancel' ? 'canceled' : null
		o.total += oi.price
	})

	o.statuses = select_map(statuses, o.status)
	o.shiptypes = select_map(shiptypes, o.shiptype)
	o.shiptype = S(o.shiptype)
	o.atime = longdate(o.atime, 'always')
	o.uname = '{0} ({1})'.format(o.uname, o.uemail)
	o.opname = firstname(o.opname, o.opemail)

	render('order', o, '#main')

	$('#main a[pid]').click(function() {
		var pid = $(this).attr('pid')
		window.open('http://6pm.com/'+pid, '_blank')
	})

	$('#shiptype').change(function() {
		$('#address_section :input').prop('disabled', $(this).val() == 'store')
	})
	$('#shiptype').trigger('change')

	$('#btn_save').click(function() {

		var items = []
		$('#main [oiid]').each(function(i, oi) {
			items.push({
				oiid:     $(this).attr('oiid'),
				note:     $(this).find('[field=itemnote]').val(),
				status:   $(this).find('[field=status]').val(),
			})
		})

		update_order(o.oid, {
			status:   $('#status').val(),
			items:    items,
			email:    $('#email').val(),
			name:     $('#name').val(),
			phone:    $('#phone').val(),
			shiptype: $('#shiptype').val(),
			shipcost: $('#shipcost').val(),
			addr:     $('#addr').val(),
			city:     $('#city').val(),
			county:   $('#county').val(),
			note:     $('#note').val(),
			opnote:   $('#opnote').val(),
			country:  'Romania',
		})
	})

}

action.order = function(oid) {
	hide_nav()
	listen('order.order_page.current_action', function(o) {
		if (o.oid != oid) return // not our order
		update_order_page(o)
	})
	load_order(oid)
}

// order module --------------------------------------------------------------

return {
	add: add_to_order,
}

})()
