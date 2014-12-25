var dataset, ajax_dataset

(function() {

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
		for (var i = 0; i < g.fields.length; i++)
			if (g.fields[i].name == fieldname)
				return i
	}

	// row id and row index by id

	var idmap = {} // {id: ri}
	var id_fi = d.id_field_name ?
		d.fieldindex_byname(d.id_field_name) : (d.id_field_index || 0)

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
		return d.attrs[k] && d.attrs[k][ri] && d.attrs[k][ri][fi]
	}

	d.setattr = function(ri, fi, k, v) {
		if (k.indexOf(' ') > -1) {
			for (k in k.split(' '))
				d.setattr(ri, fi, k, v)
			return
		}
		d.attrs[k] = d.attrs[k] || []
		if (v === undefined) {
			delete d.attrs[k][ri][fi]
			if (!d.attrs[k][ri].length)
				delete d.attrs[k][ri]
		} else {
			d.attrs[k][ri] = d.attrs[k][ri] || []
			d.attrs[k][ri][fi] = v
		}
	}

	d.row_attrs = function(ri, k) {
		return d.attrs[k] && d.attrs[k][ri]
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
			d.setattr(ri, fi, 'oldval', d.val(ri, fi))
			d.setattr(ri, 0, 'row_changed', true)
		} else if (val === oldval) {
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
		return d.attr('oldval', ri, fi) !== undefined
	}

	// insert a new record with default values at index

	// create a record with all values set to null
	d.empty_record = function() {
		var rec = []
		for (var fi = 0; fi < d.fields.length; fi++)
			rec.push(null)
		return rec
	}

	// set default values where values are null in a record
	d.set_defaults = function(rec) {
		for (var fi = 0; fi < d.fields.length; fi++) {
			if (rec[fi] == null) {
				var val = d.fields[fi].default
				if (val != null)
					rec[fi] = val
			}
		}
		return rec
	}

	d.insert = function(ri) {
		if (ri == null)
			ri = d.row_count()
		var rec = d.set_defaults(d.empty_record())

		if (ri > d.clamp_rowindex(ri)) {
			// explanation: splice doesn't insert on out-of-range indices
			d.values[ri] = rec
		} else {
			d.values.splice(ri, 0, rec)
			for (k in d.attrs)
				d.attrs[k].splice(ri, 0, undefined)
		}

		d.setattr(ri, 0, 'row_inserted', true)
	}

	d.row_is_new = function(ri) {
		return d.attr(ri, 0, 'row_inserted') !== undefined
	}

	// remove a record at index

	d.remove = function(ri) {
		if (!d.row_is_new(ri))
			d.removed.push(d.rowid(ri))

		d.values.splice(ri, 1)
		for (k in d.attrs)
			d.attrs[k].splice(ri, 1)
	}

	// pack current change set

	d.changed_values = function(ri) {
		var values = {}
		var oldvals = d.row_attrs(ri, 'oldval')
		for (var fi in oldvals)
			values[d.fields[fi].name] = d.values[ri][fi]
		return values
	}

	d.pack_changeset = function() {
		var update = []
		var insert = []
		var changeset = {update: update, insert: insert, delete: d.removed}
		for (var ri in d.attrs.row_changed) {
			var values = d.changed_values(ri)
			if (d.row_is_new(ri)) continue
			update.push({id: d.rowid(ri), values: values})
		}
		for (var ri in d.attrs.row_inserted) {
			var values = d.changed_values(ri)
			insert.push(values)
		}
		return changeset
	}

	// update current change set

	d.update_records = function(records) {
		for (var i = 0; i < records.length; i++) {
			var rec = records[i]
			var ri = d.rowindex_byid(rec.id)
			for (var fi = 0; fi < d.fields.length; fi++) {
				var serverval = rec.values[fi]
				var oldval = d.attr('oldval', ri, fi)
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
			// as "changed", the row itself is not changed until the user
			// changes at least one cell again.
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

