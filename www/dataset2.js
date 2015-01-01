var dataset, ajax_dataset

(function() {

// helpers -------------------------------------------------------------------

function assert(t, err) {
	if (t == null || t === false)
		throw (err || 'assertion failed')
	return t
}

function clamp(x, x0, x1) {
	return Math.min(Math.max(x, x0), x1)
}

function insert(a, i, e) {
	if (i >= a.length) {
		// make sparse array: splice won't insert here.
		if (e !== undefined)
			a[i] = e
	} else
		a.splice(i, 0, e)
}

function remove(a, i) {
	var v = a[i]
	a.splice(i, 1)
	return v
}

function range(i0, i1) {
	var a = []
	for(var i = i0; i <= i1; i++)
		a.push(i)
	return a
}

function make_url(path, opt_args, opt_params) {
	var args = []
	for (var i in opt_args)
		args.push(encodeURIComponent(opt_args[i]))
	args = args.join('/')

	var params = []
	for (var k in opt_params)
		params.push(encodeURIComponent(k)+'='+encodeURIComponent(opt_params[k]))
	params = params.join('&')

	return path+(args?'/'+args:'')+(params?'?'+params:'')
}

function json(v) {
	return typeof v == 'string' ? JSON.parse(v) : JSON.stringify(v)
}

// dataset -------------------------------------------------------------------

dataset = function(d_opt) {

	var d = {}

	// events aspect ----------------------------------------------------------

	var ev = $(d)
	d.on = ev.on
	d.trigger = ev.trigger

	// memory I/O aspect ------------------------------------------------------

	// data
	var fields = [] // [fi: {name:, client_default: v, server_default: v, ...}]
	var rows   = [] // [ri: row]; row = {values: [fi: val], attr: val, ...}
	// static maps
	var fieldmap    // [vfi: fi]
	var rowmap      // [vri: ri]
	// row filter
	var filter      // function(values, ri) -> true|false

	var fieldindex_byname = function(fieldname) {
		for (var i in fields)
			if (fields[i].name == fieldname)
				return i
	}

	var init_locals = function() {
		fields = d.fields
		rows = d.rows
		fieldmap = d.fieldmap
		filter = d.filter
	}

	var init_fieldmap = function() {
		if (fieldmap) return
		fieldmap = range(0, fields.length-1)
		d.fieldmap = fieldmap
	}

	var init_rowmap = function() {
		rowmap = []
		for (var ri = 0; ri < rows.length; ri++) {
			var row = rows[ri]

			// skip if deleted
			if (row.deleted)
				continue

			// skip if filtered
			if (filter)
				if (!filter(row))
					continue

			// add the index to the rowmap
			rowmap.push(ri)

			// skip all children of the record if the record is collapsed
			var n = row.children && row.children.count
			if (n && !row.expanded)
				ri += n
		}
	}

	// get rows and fields

	d.fieldcount = function() { return fieldmap.length; }
	d.rowcount = function() { return rowmap.length; }

	d.field = function(vfi) { return fields[fieldmap[vfi]]; }
	d.row = function(vri) { return rows[rowmap[vri]]; }

	// get/set row values

	d.val = function(vri, vfi) {
		var ri = rowmap[vri]
		var fi = fieldmap[vfi]
		var row = rows[ri]
		var field = fields[fi]
		var val = field.value // computed value?
		return val ? val(field, row, fields) : row.values[fi]
	}

	d.setval = function(vri, vfi, v) {
		var ri = rowmap[vri]
		var fi = fieldmap[vfi]
		var row = rows[ri]
		var field = fields[fi]

		// validate
		var validate = field.validate
		if (validate && !validate(v, field, row, fields))
			return false

		// save old values if not already saved
		if (!row.oldvalues)
			row.oldvalues = row.values.slice(0)

		// set the value
		row.values[fi] = v

		// trigger changed event
		ev.trigger('changed', [vri, vfi, v, field, row])

		return true
	}

	// add/remove rows

	d.new_row = function() {
		var rec = []

		// add server_default values or null
		for (var fi in fields) {
			var field = fields[fi]
			var val = field.server_default
			rec.push(val !== undefined ? val : null)
		}

		// set record id to a client-generated id
		set_client_id(rec)

		return {values: rec, isnew: true}
	}

	d.insert = function(vri) {
		// default row index is right after the last row
		if (vri == null)
			vri = d.rowcount()

		var ri = rowmap[vri]
		// out of visible range? insert at the end of the unfiltered array
		if (ri === undefined)
			ri = rows.length

		// make a new row
		var row = d.new_row()

		// make it a sibling of the row it displaced
		if (rows[ri]) {
			var prow = rows[ri].parent_row
			row.parent_row = prow
			prow.children.push(row)
		}

		// insert the new row at ri
		insert(rows, ri, row)

		// update idmap on ri
		update_idmap(ri)

		// recreate rowmap
		init_rowmap()

		// set client defaults
		for (var fi in fields) {
			var field = fields[fi]
			var val = field.client_default
			if (val !== undefined)
				d.setval(ri, fi, val)
		}
	}

	d.remove = function(vri) {
		// default row index is that of the last row
		if (vri == null)
			vri = d.rowcount() - 1

		var ri = rowmap[vri]
		var row = rows[ri]

		if (row.isnew)
			remove(rows, ri)
		else
			row.deleted = true

		// recreate rowmap
		init_rowmap()
	}

	d.init = function() {
		init_locals()
		init_fieldmap()
		init_idmap()
		init_tree()
		init_rowmap()
	}

	// row id and row index by id aspect --------------------------------------

	// client row id aspect
	d.last_id = 0
	d.new_id = function() {
		return --d.last_id // use negative values for client-generated ids
	}

	var set_client_id = function(rec) {
		rec[id_fi] = d.new_id()
	}

	var update_idmap = function(ri) {
		var id = rows[ri].values[id_fi]
		idmap[id] = ri
	}

	var idmap // {id: ri}
	var id_fi  // field index of the id field

	var init_idmap = function() {

		// find id_fi
		id_fi = d.id_field_name ?
			assert(fieldindex_byname(d.id_field_name)) :
			(d.id_field_index || 0)

		// init idmap based on id_fi
		idmap = {}
		for (var ri in rows)
			update_idmap(ri)

	}

	d.rowindex_byid = function(id) {
		return idmap[id]
	}

	d.row_id = function(vri) {
		return rows[rowmap[vri]].values[id_fi]
	}

	// tree aspect ------------------------------------------------------------

	d.initially_expanded = false

	var parent_fi // field index of the parent field

	var init_tree = function() {

		// find field index of parent field
		parent_fi = d.parent_id_field_name ?
			assert(fieldindex_byname(d.parent_id_field_name)) :
			d.parent_id_field_index

		if (!parent_fi) return

		// make tree
		var root_rows = []
		for (var ri in rows) {
			var row = rows[ri]
			row.expanded = d.initially_expanded
			var pid = row.values[parent_fi]
			if (pid != null) {
				var prow = rows[idmap[pid]]
				row.parent_row = prow
				row.level = prow.level + 1
				prow.children = prow.children || []
				prow.children.push(row)
			} else {
				row.level = 0
				root_rows.push(row)
			}
		}

		// recreate the rows array based on the tree
		rows = []
		function push_rows(root_rows) {
			for (ri in root_rows) {
				var row = root_rows[ri]
				rows.push(row)
				if (row.children)
					push_rows(row.children)
			}
		}
		push_rows(root_rows)
	}

	d.parent_id = function(vri) {
		return rows[rowmap[vri]].values[parent_fi]
	}

	d.collapse_all = function() {
		for (ri in rows)
			if (ri.expanded)
				ri.expanded = false
		init_rowmap()
	}

	d.expand_all = function() {
		for (ri in rows)
			if (!ri.expanded)
				ri.expanded = true
		init_rowmap()
	}

	// changeset aspect -------------------------------------------------------

	d.row_is_new = function(vri) { return rows[rowmap[vri]].isnew; }

	d.row_changed = function(vri) { return !!rows[rowmap[vri]].oldvalues; }

	d.val_changed = function(vri, vfi) {
		var row = rows[rowmap[vri]]
		var fi = fieldmap[vfi]
		var oldvals = row.oldvalues
		return oldvals && oldvals[fi] !== row.values[fi]
	}

	d.removed_rows = function() {

	}

	d.changes = function() {

		var insert = []

		var update = []

		var remove = []
		for (var ri in rows)
			if (rows[ri].deleted)
				remove.push(rows[ri].values[id_fi])

		var row_order = []

		return {
			insert: insert,
			update: update,
			remove: remove,
			row_order: row_order,
		}
	}

	d.reconcile = function(results) {}
	d.changed_values = function() {}
	d.apply_changes = function() {}
	d.cancel_changes = function() {}

	// serialization aspect ---------------------------------------------------

	d.records = function() {
		var t = []
		for (var vri = 0; vri < d.rowcount(); vri++) {
			var rec = {}
			t.push(rec)
			for (var vfi = 0; vfi < d.fieldcount(); vfi++)
				rec[fields[fieldmap[vfi]].name] = d.val(vri, vfi)
		}
		return t
	}

	d.serialize = function() {
		return json(d.records())
	}

	d.deserialize = function(s) {
		var t = json(s)
		//TODO
	}

	// remote I/O aspect ------------------------------------------------------

	// protocol options
	d.url_path = null   // set to enable remote I/O
	d.url_args = []     // path components after url_path
	d.url_params = {}   // url query params

	// pagination options
	d.page = 1
	d.page_size = 100

	// server-side order-by expression
	d.sort_expr = function() {
		var s = ''
		for (var fi in fields) {
			var field = fields[fi]
			if (field.name && field.sort)
				s += field.name+':'+field.sort
		}
		return s
	}

	// url forming
	d.url = function() {
		if (!d.url_path) return
		var params = {}
		var sort = d.sort_expr()
		if (sort) params.sort = sort
		if (d.page) params.page = d.page
		$.extend(params, d.url_params)
		return make_url(d.url_path, d.url_args, params)
	}

	d.ajax_success = function(data) {} // stub
	d.ajax_error = function(xhr) {} // stub

	// make a GET request (or a POST request if data is passed).
	d.ajax = function(data, success, error) {
		var url = d.url()
		if (!url) {
			d.ajax_success()
			if (success) success()
			return
		}
		var opt = {}
		opt.success = function(data) {
			d.ajax_success(data)
			if (success) success(data)
		}
		opt.error = function(xhr) {
			d.ajax_error(xhr)
			if (error) error(xhr)
		}
		if (data != null) {
			opt.type = 'POST'
			opt.data = {data: json(data)}
		}
		$.ajax(url, opt)
	}

	d.load = function(success, error) {
		function succ(data) {
			d.rows = data.rows
			d.init()
			if (success) success()
		}
		d.ajax(null, succ, error)
	}

	d.save = function(success, error) {
		function succ(data) {
			d.reconcile(data)
			if (success) success()
		}
		d.ajax(d.changes(), succ, error)
	}

	// init -------------------------------------------------------------------

	$.extend(d, d_opt)
	d.init()
	d.json = json
	return d
}


})()

var d = dataset({
	fields: [{name: 'id'},{name: 'name'},{name: 'parent_id'}],
	parent_id_field_name: 'parent_id',
	rows: [
		{values: [1,'a',null]},
		{values: [2,'b',null]},
		{values: [3,'c',1]},
		{values: [4,'d',1]},
		{values: [5,'e',3]},
		{values: [6,'f',3]},
		{values: [7,'g',6]},
	],
})

/*
d.remove(2) // remove 3
d.remove(3) // remove 5
d.remove(4) // remove 7
d.insert()  // insert after the removed 7
*/

function str_repeat(s, n) {
	return new Array(n+1).join(s)
}

var s = ''
for(ri=0;ri<d.rowcount();ri++) {
	s += str_repeat('   ',d.row(ri).level)
	for(fi=0;fi<d.fieldcount();fi++)
		s += d.val(ri, fi) + ' '
	s += '\n'
}
console.log(s)

//console.log(d.serialize())
//console.log(d.json(d.changes()))

