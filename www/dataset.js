var dataset, ajax_dataset

(function() {

// helpers -------------------------------------------------------------------

function assert(t, err) {
	if (t == null || t == false)
		throw (err || 'assertion failed')
	return t
}

function clamp(x, x0, x1) {
	return Math.min(Math.max(x, x0), x1)
}

function insert(a, i, e) {
	if (i >= a.length) // sparse
		a[i] = e
	else
		a.splice(i, 0, e)
}

function remove(a, i) {
	var v = a[i]
	a.splice(i, 1)
	return v
}

// dataset -------------------------------------------------------------------

dataset = function(d_opt) {

	var d = {
		fields: [],           // [{name:, ...}]
		attrs: {value: []},   // {key: [ri: [fi: val]]}
		removed: [],          // [id1,...]
	}

	// get field index by name

	d.fieldindex_byname = function(fieldname) {
		for (var i in g.fields)
			if (g.fields[i].name == fieldname)
				return i
	}

	// row id and row index by id

	var idmap = {} // {id: ri}
	var id_fi = d.id_field_name ?
		assert(d.fieldindex_byname(d.id_field_name)) :
		(d.id_field_index || 0)

	d.rowindex_byid = function(id) {
		return idmap[id]
	}

	d.rowid = function(ri) {
		return d.val(ri, id_fi)
	}

	// get row count; get value

	d.row_count = function() {
		return d.attrs.value.length
	}

	d.clamp_rowindex = function(ri, extra) {
		return clamp(ri, 0, d.row_count() - 1 + (extra || 0))
	}

	d.check_rowindex = function(ri, extra) {
		assert(d.clamp_rowindex(ri, extra) === ri)
		return ri
	}

	d.val = function(ri, fi) {
		return d.attrs.value[ri][fi] // not sparse, unlike all other attrs
	}

	// get/set cell attributes

	d.attr = function(ri, fi, k) {
		var t = d.attrs[k]; if (!t) return
		var r = t[ri]; if (!r) return
		return r[fi]
	}

	d.setattr = function(ri, fi, k, v) {
		if (k.indexOf(' ') > -1) {
			// set multiple attributes to the same value
			var t = k.split(' ')
			for (var k in t)
				d.setattr(ri, fi, t[k], v)
			return
		}
		var t = d.attrs[k]
		if (v === undefined) {
			// remove attr value
			if (!t) return
			var r = t[ri]
			if (!r) return
			delete r[fi]
			if (!r.length) {
				delete t[ri]
				if (!t.length)
					delete d.attrs[k]
			}
		} else {
			// set attr value
			if (!t) {
				t = []
				d.attrs[k] = t
			}
			var r = t[ri]
			if (!r) {
				r = []
				t[ri] = r
			}
			r[fi] = v
		}
	}

	d.row_attrs = function(ri, k) {
		var t = d.attrs[k]; if (!t) return
		return t[ri]
	}

	// (re-)initialize the current change set

	d.reset_changeset = function() {
		delete d.attrs.oldval
		delete d.attrs.row_inserted
		delete d.attrs.row_changed
		d.removed = []
		d.order_changed = false
	}

	// set value, tracking changed values

	d.setvalue = function(ri, fi, val) {
		var oldval = d.attr(ri, fi, 'oldval')
		if (oldval === undefined) {
			// first-time change.
			d.setattr(ri, fi, 'oldval', d.val(ri, fi))
			d.setattr(ri, 0, 'row_changed', true)
		} else if (val === oldval) {
			// changed back to old value.
			d.setattr(ri, fi, 'oldval')
			if (!d.row_attrs(ri, 'oldval'))
				d.setattr(ri, 0, 'row_changed')
		}
		d.attrs.value[ri][fi] = val // not sparse, unlike all other attrs
	}

	d.row_changed = function(ri) {
		return d.attr(ri, 0, 'row_changed') !== undefined
	}

	d.value_changed = function(ri, fi) {
		return d.attr(ri, fi, 'oldval') !== undefined
	}

	// insert a new record with default values at index

	d.last_id = 0

	d.new_id = function() {
		return --d.last_id // use negative values for client-generated ids
	}

	d.new_record = function() {
		var rec = []
		for (var fi in d.fields) {
			var field = d.fields[fi]
			var val = field.server_default
			rec.push(val !== undefined ? val : null)
		}
		rec[id_fi] = d.new_id()
		return rec
	}

	d.insert = function(ri) {
		if (ri == null)
			ri = d.row_count()

		// shift attr arrays to make room for the record at ri.
		for (var k in d.attrs)
			insert(d.attrs[k], ri)

		// set a new record at ri.
		var rec = d.new_record()
		d.attrs.value[ri] = rec

		// update idmap
		console.log('ins', JSON.stringify(d.attrs.value))
		idmap[rec[id_fi]] = ri

		// mark row as inserted and changed.
		d.setattr(ri, 0, 'row_inserted row_changed', true)

		// set client defaults.
		for (var fi in d.fields) {
			var field = d.fields[fi]
			var val = field.client_default
			if (val !== undefined)
				d.setvalue(ri, fi, val)
		}
	}

	d.row_is_new = function(ri) {
		return d.attr(ri, 0, 'row_inserted') !== undefined
	}

	// remove a record at index

	d.remove = function(ri) {
		if (!d.row_is_new(ri))
			d.removed.push(d.rowid(ri))

		for (var k in d.attrs)
			remove(d.attrs[k], ri)
	}

	// move a record to a new index

	d.move = function(sri, dri) {
		sri = d.check_rowindex(sri)
		dri = d.clamp_rowindex(dri, 1)
		if (sri == dri) return

		// update attrs (TODO: do it without remove/insert)
		for (var k in d.attrs) {
			var t = d.attrs[k]
			var row = remove(t, sri)
			insert(t, dri > sri ? dri-1 : dri, row)
		}

		d.order_changed = true
	}

	// pack current change set

	d.changed_values = function(ri) {
		var values = {}

		// add changed values
		var oldvals = d.row_attrs(ri, 'oldval')
		for (var fi in oldvals)
			values[d.fields[fi].name] = d.val(ri, fi)

		// add the id field
		values[d.fields[id_fi].name] = d.rowid(ri)

		return values
	}

	d.pack_changeset = function() {

		var update = []
		for (var ri in d.attrs.row_changed)
			if (!d.row_is_new(ri))
				update.push(d.changed_values(ri))

		var insert = []
		for (var ri in d.attrs.row_inserted)
			insert.push(d.changed_values(ri))

		var row_order
		if (d.order_changed) {
			row_order = []
			for (var ri in d.attrs.value)
				row_order.push(d.rowid(ri))
		}

		return {
			update: update,
			insert: insert,
			remove: d.removed,
			row_order: row_order,
		}
	}

	// update current change set

	d.update_changeset = function(changeset) {
		for (var i in changeset.update) {
			var rec = changeset.update[i]
			var ri = d.rowindex_byid(rec.id)
			for (var fi in d.fields) {
				var serverval = rec.values[fi]
				var oldval = d.attr(ri, fi, 'oldval')
				var userval = d.val(ri, fi)
				if (serverval === userval) {
					d.setattr(ri, fi, 'rejected corrected oldval')
				} else if (serverval === oldval) {
					d.setattr(ri, fi, 'corrected rejected')
					d.setattr(ri, fi, 'error', rec.error)
				} else {
					d.setvalue(ri, fi, serverval)
					d.setattr(ri, fi, 'userval', userval)
					d.setattr(ri, fi, 'oldval rejected')
					d.setattr(ri, fi, 'corrected', true)
				}
			}
			// even if some cells got rejected and thus they're still marked
			// as "changed", the row itself will not get changed until
			// the user changes at least one cell again.
			d.setattr(ri, 0, 'row_changed')
		}
	}

	// active record

	var ri = 0

	d.active_rowindex = function() {
		return ri
	}

	d.move_cursor = function(ri_) {
		ri = clamp(ri_, 0, d.row_count() - 1)
		$(d).trigger('move', ri)
	}

	$.extend(d, d_opt)

	return d
}

ajax_dataset = function(d_opt) {

	var d = {}

	d.fetch = function() {

	}

	d.update = function(records) {
		$.each(records, function(_, rec) {

		})
	}

	return dataset($.extend(d, d_opt))
}

})()


// test ----------------------------------------------------------------------

if (true) {

var ds = dataset({
	fields: [
		{name: 'id'},
		{name: 'name', default: 'default_name'},
	],
	attrs: {
		value: [[1, 'name1'], [2, null]],
	},
})

ds.insert() // insert row at the bottom
ds.setvalue(ds.row_count()-1, 1, 'hello') // overwrite default value on new row
ds.insert(0) // insert row at the top with default values
ds.setvalue(1, 1, '1-changed') // set value on existing row
ds.remove(2) // remove the second existing row
ds.insert() // insert row at the bottom to be deleted
ds.setvalue(ds.row_count()-1, 1, 'changed') // set value on new row about to be deleted
ds.remove(ds.row_count() - 1) // remove new, changed row
ds.move(1, 0)

console.log(JSON.stringify(ds.attrs))
console.log(JSON.stringify(ds.pack_changeset()))

}

