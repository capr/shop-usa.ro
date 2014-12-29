var dataset, ajax_dataset

(function() {

function assert(t, err) { if (t == null) throw (err || 'assertion failed'); return t; }
function clamp(x, x0, x1) { return Math.min(Math.max(x, x0), x1); }

//
dataset = function(d) {

	var d = $.extend({
		fields: [],   // [{name:, ...}]
		values: [],   // [[v11,v12,...],[v21,v22,...],...]
		attrs: {},    // {key: [ri: [fi: val]]}
		removed: [],  // [id1,...]
	}, d)

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
		return d.values.length
	}

	d.clamp_rowindex = function(ri) {
		return clamp(ri, 0, d.row_count() - 1)
	}

	d.val = function(ri, fi) {
		return d.values[ri][fi]
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
			// remove attr
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
			// set attr
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
		d.values[ri][fi] = val
	}

	d.row_changed = function(ri) {
		return d.attr(ri, 0, 'row_changed') !== undefined
	}

	d.value_changed = function(ri, fi) {
		return d.attr(ri, fi, 'oldval') !== undefined
	}

	// insert a new record with default values at index

	d.empty_record = function() {
		var rec = []
		for (var fi in d.fields) {
			var field = d.fields[fi]
			var val = field.server_default
			rec.push(val !== undefined ? val : null)
		}
		return rec
	}

	d.insert = function(ri) {
		if (ri == null)
			ri = d.row_count()
		var rec = d.empty_record()

		if (ri > d.clamp_rowindex(ri)) {
			// explanation: splice doesn't insert on out-of-range indices.
			d.values[ri] = rec
		} else {
			d.values.splice(ri, 0, rec)
			// shift attr arrays too to make room for the record.
			for (var k in d.attrs)
				d.attrs[k].splice(ri, 0, undefined)
		}
		// mark row as inserted and changed.
		d.setattr(ri, 0, 'row_inserted row_changed', true)

		// set client defaults.
		for (var fi in d.fields) {
			var field = d.fields[fi]
			var val = field.client_default
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

		d.values.splice(ri, 1)
		for (var k in d.attrs)
			d.attrs[k].splice(ri, 1)
	}

	// pack current change set

	d.changed_values = function(ri) {
		var values = {}

		// add changed values
		var oldvals = d.row_attrs(ri, 'oldval')
		for (var fi in oldvals)
			values[d.fields[fi].name] = d.values[ri][fi]

		// add the id field
		values[d.fields[id_fi].name] = d.values[ri][id_fi]

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

		return {
			update: update,
			insert: insert,
			remove: d.removed,
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
					d.setattr(ri, fi, 'userval', userval)
					d.setvalue(ri, fi, serverval)
					d.setattr(ri, fi, 'oldval rejected')
					d.setattr(ri, fi, 'corrected', true)
					d.setattr(ri, fi, 'wanted', userval)
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

	d.move = function(ri_) {
		ri = clamp(ri_, 0, d.row_count() - 1)
		$(d).trigger('move', ri)
	}

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
	values: [[1, 'name1'], [2, null]],
})

ds.insert() // insert row at the bottom
ds.setvalue(ds.row_count()-1, 1, 'hello') // overwrite default value on new row
ds.insert(0) // insert row at the top with default values
ds.setvalue(1, 1, '1-changed') // set value on existing row
ds.remove(2) // remove the second existing row
ds.insert() // insert row at the bottom to be deleted
ds.setvalue(ds.row_count()-1, 1, 'changed') // set value on new row about to be deleted
ds.remove(ds.row_count() - 1)  // remove new, changed row
console.log(JSON.stringify(ds.values))
console.log(JSON.stringify(ds.attrs))
console.log(JSON.stringify(ds.pack_changeset()))

}

