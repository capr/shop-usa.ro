var grid = (function() {

function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
function is(arg) { return arg !== undefined && arg !== null; }
function clamp(x, x0, x1) { return Math.min(Math.max(x, x0), x1); }

function text_selected(input) {
	if (!input) return
	var p0 = input[0].selectionStart
	var p1 = input[0].selectionEnd
	return p0 == 0 && p1 == input.val().length
}

var active_grid

function grid(g) {

	var g = $.extend({
		dst: '#main',
		page_rows: 20, // how many rows on page-down / up (TODO: autocompute)
		immediate_mode: false,
	}, g)

	// values -----------------------------------------------------------------

	// make a new record with default values
	g.create_record = function() {
		var rec = []
		for (var i = 0; i < g.fields.length; i++)
			rec.push(g.fields[i]['default'] || null)
		return rec
	}

	// rec_id->row map --------------------------------------------------------

	function fieldindex_byname(fieldname) {
		for (var i = 0; i < g.fields.length; i++)
			if (g.fields[i].name == fieldname)
				return i
	}

	var idmap // id: row
	var id_fi

	function make_idmap() {
		id_fi = fieldindex_byname(g.idfield) || 0
		idmap = {}
		var rows = g.rows()
		for (var ri = 0; ri < g.values.length; ri++) {
			var rec = g.values[ri]
			var id = rec[id_fi]
			idmap[id] = rows[ri]
		}
	}

	g.row_byid = function(id) {
		return $(idmap[id])
	}

	g.row_id = function(row) {
		var ri = $(row).index()
		return g.values[ri][id_fi]
	}

	// col_index<->field_index mappings ---------------------------------------

	function make_fieldmaps() {
		if (!g.fieldmap) {
			g.fieldmap = []
			g.rfieldmap = []
			for (var i = 0; i < g.fields.length; i++) {
				g.fieldmap.push(i)
				g.rfieldmap.push(i)
			}
		} else {
			g.rfieldmap = g.fieldmap.slice()
			for (var ci = 0; i < g.fieldmap.length; ci++) {
				var fi = g.fieldmap[ci]
				g.rfieldmap[fi] = ci
			}
		}
	}

	g.field = function(ci) {
		return g.fields[g.fieldmap[ci]]
	}

	// rendering --------------------------------------------------------------

	var format_value = function(v, field) {
		return (v === null) ? 'null' : v
	}
	g.format_value = format_value

	var value_type = function(v, field) {
		return v === null ? 'null' : (typeof v)
	}
	g.value_type = value_type

	function render_context(values) {

		var t = {}
		var rec, ci
		var val = {}

		var ft = []
		$.each(g.fieldmap, function(ci, fi) {
			ft.push($.extend({
				index: ci,
				align: 'left',
			}, g.fields[fi]))
		})
		t.fields = ft
		t.rows = values

		t.cols = function(rec_) {
			ci = 0
			rec = rec_
			return ft
		}

		t.col = function() {
			var fi = g.fieldmap[ci]
			val.field = g.fields[fi]
			val.raw = rec[fi]
			ci++
			return val
		}

		val.value = function(v) { return format_value(v.raw, v.field); }
		val.type = function(v) { return value_type(v.raw); }
		val.readonly = function(v) { return v.field.readonly ? 'readonly' : ''; }
		val.align = function(v) { return v.field.align; }

		return t
	}

	g.get_template = function(name) {
		return $('#' + name + '_template').html()
	}

	g.render = function() {
		make_fieldmaps()
		var dst = $(g.dst)
		var ctx = render_context(g.values)
		var s = Mustache.render(g.get_template('grid'), ctx, g.get_template)
		dst.html(s)
		g.grid = dst.find('.grid')
		make_idmap()
		make_clickable()
	}

	// selectors --------------------------------------------------------------

	g.row_count = function() { return g.values.length; }
	g.col_count = function() { return g.fieldmap.length; }

	g.rows_ct = function() { return g.grid.find('.rows'); }
	g.rows = function() { return g.grid.find('.row'); }
	g.row = function(i) {
		i = clamp(i, 0, g.row_count() - 1)
		return g.rows().filter(':nth-child('+(i+1)+')')
	}
	g.cells = function(row) { return (row ? $(row) : g.grid).find('.cell'); }
	g.cell = function(row, i) {
		if (typeof row == 'number')
			row = g.row(row)
		else
			row = $(row)
		i = clamp(i, 0, g.col_count() - 1)
		return row.find('.cell:nth-child('+(i+1)+')')
	}
	g.cols = function() { return g.grid.find('.field'); }
	g.rowof = function(cell) { return cell.parent(); }

	// cell values ------------------------------------------------------------

	g.cast = function(val, ci) {
		var field = g.field(ci)
		if (field.type == 'number') {
			val = parseFloat(val)
			if (val != val)
				val = null
		} else if (field.type == 'boolean') {
			val = !!val
		}
		return val
	}

	g.val = function(cell, val) {
		cell = $(cell)
		var ci = cell.index()
		var ri = g.rowof(cell).index()
		var fi = g.fieldmap[ci]
		var curval = g.values[ri][fi]
		if (val === undefined) // get it
			return curval
		if (val !== curval) { // set it
			val = g.cast(val, ci)
			g.values[ri][fi] = val
			var v = cell.find('.value')
			v.html(g.format_value(val, g.field(ci)))
			v.removeClass('null string number boolean')
			v.addClass(g.value_type(val))
			return curval // return the replaced value
		}
	}

	// grid selection ---------------------------------------------------------

	g.active_grid = function() { return active_grid; }
	g.active = function() { return active_grid == g; }

	g.deactivate = function() {
		if (!g.active())
			throw 'not active'
		if (!g.exit_edit()) return
		g.grid.removeClass('focused')
		active_grid = null
		return true
	}

	g.activate = function() {
		if (g.active()) return true
		if (active_grid && !active_grid.deactivate())
			return
		g.grid.addClass('focused')
		active_grid = g
		return true
	}

	// row selection ----------------------------------------------------------

	g.selected_rows = function() { g.grid.find('.row.selected'); }
	g.deselect_rows = function(rows) { rows.removeClass('selected'); }
	g.select_rows = function(rows) { rows.addClass('selected'); }

	// row focusing -----------------------------------------------------------

	var active_row = $([])

	g.deactivate_row = function() {
		if (!g.deactivate_cell()) return
		if (!g.exit_row(active_row)) return
		var row = active_row
		row.removeClass('active')
		g.deselect_rows(row)
		active_row = $([])
		return row
	}

	g.activate_row = function(row) {
		row = $(row)
		if (!row.length) return // no row
		if (active_row.is(row)) return // same row
		var prev_row = g.deactivate_row()
		if (!prev_row) return
		g.select_rows(row)
		row.addClass('active')
		active_row = row
		return prev_row
	}

	g.active_row = function(row) {
		if (!row) return active_row
		return g.activate_row(row)
	}

	// cell focusing ----------------------------------------------------------

	var active_cell = $([])

	g.deactivate_cell = function() {
		if (!g.exit_edit()) return
		var cell = active_cell
		cell.removeClass('active')
		active_cell = $([])
		return cell
	}

	g.activate_cell = function(cell) {
		if (!g.activate()) return
		cell = $(cell)
		if (!cell.length) return // no cell
		if (active_cell.is(cell)) return // same cell
		if (!g.rowof(cell).is(g.active_row())) { // diff. row
			if (!g.activate_row(g.rowof(cell)))
				return
		} else { // same row
			if(!g.deactivate_cell())
				return
		}
		cell.addClass('active')
		cell.scrollintoview({duration: 0})
		active_cell = cell
		return true
	}

	g.active_cell = function(cell) {
		if (!cell) return active_cell
		return g.activate_cell(cell)
	}

	// cell editing -----------------------------------------------------------

	var active_input

	g.input = function() { return active_input; }
	g.caret = function(caret) {
		if (!active_input) return
		if (!is(caret))
			return active_input.caret()
		active_input.caret(caret)
	}
	g.focused = function() {
		if (!active_input) return
		return active_input.is(':focus')
	}

	g.enter_edit = function(caret, select) {
		if (active_input)
			return active_input
		var cell = active_cell
		if (!cell.length) return
		var field = g.field(cell.index())
		if (field.readonly) return
		var val = g.val(cell)
		var w = cell.width()
		var h = cell.height()
		var div = cell.find('.input_div')
		div.html('<input type=text class=input'+
			(field.maxlength ? ' maxlength='+field.maxlength : '')+
			' style="width: '+w+'px; height: '+h+'px; text-align: '+field.align+'">')
		var input = div.find('input')
		input.val(val)
		input.focus()
		if (is(caret))
			input.caret(caret)
		if (select)
			input.select()
		input.focusout(function() {
			g.exit_edit()
		})
		active_cell.addClass('edit')
		active_input = input
		return input
	}

	g.exit_edit = function(cancel) {
		if (!active_input)
			return true
		var cell = active_cell
		if (!cancel) {
			var ci = active_cell.index()
			var curval = g.val(active_cell)
			var newval = g.cast(active_input.val().trim(), ci)
			if (newval !== curval) {
				g.val(cell, newval)
				cell.removeClass('rejected corrected')
				var oldval = cell.data('oldval')
				if (newval !== oldval) {
					cell.addClass('changed')
					if (oldval === undefined) {
						cell.data('oldval', curval)
						cell.attr('title', 'old value: '+g.format_value(curval, g.field(ci)))
					}
				} else
					cell.removeClass('changed')
				// even if the cell just got reverted back to its old value,
				// the row still gets marked as changed, because other cells
				// might still be in rejected state.
				g.rowof(cell).addClass('changed')
			}
		}
		cell.removeClass('edit')
		cell.find('.input_div').html('')
		active_input = null
		g.quick_edit = null
		return true
	}

	g.insert_row = function(ri) {

		// range-check & set default row index
		if (!is(ri))
			ri = g.active_row().index()
		ri = clamp(ri, 0, g.row_count())
		var append = ri == g.row_count()

		// make a new record with default values
		var rec = g.create_record()

		// add it to the values table
		g.values.splice(ri, 0, rec)

		// render it, add it to position, and get it
		var s = render('grid_rows', render_context([rec]))
		if (append)
			g.rows_ct().append(s)
		else
			g.row(ri).before(s)

		var row = g.row(ri)
		var cells = g.cells(row)

		// activate the row on the same cell as before
		g.activate_cell(g.cell(row, g.active_cell().index()))

		// mark non-null cells and the row as changed
		$.each(rec, function(fi, val) {
			if (val !== null) {
				g.cell(row, g.rfieldmap[fi]).addClass('changed')
				row.addClass('changed')
			}
		})

		// mark all cells and the row as new
		cells.addClass('new')
		row.addClass('new')
	}

	var deleted = [] // [rec1, ...]

	g.delete_row = function(ri) {

		// range-check & set default row index
		if (!is(ri))
			ri = g.active_row().index()
		if (ri < 0 || ri >= g.row_count())
			return

		var row = g.row(ri)
		var ci = g.active_cell().index()

		// deactivate row
		if (g.active_row().is(row))
			if (!g.deactivate_row(row))
				return

		// if not new, store and mark as deleted
		if (!row.hasClass('new'))
			deleted[g.row_id(row)] = g.values[ri]

		// remove from the values table
		g.values.splice(ri, 1)

		// remove from DOM
		row.remove()

		// activate the row on the same cell as before
		g.activate_cell(g.cell(ri, ci))
	}

	// saving data ------------------------------------------------------------

	g.exit_row = function(row) {
		return g.exit_edit() && g.save()
	}

	function update_records(records) {
		for (var i = 0; i < records.length; i++) {
			var rec = records[i]
			var row = g.row_byid(rec.id)
			g.cells(row).each(function(ci, cell) {
				cell = $(cell)
				var fi = g.fieldmap[ci]
				var serverval = rec.values[fi]
				var oldval = cell.data('oldval')
				var userval = g.val(cell)
				if (serverval === userval) {
					cell.removeClass('rejected corrected changed')
					cell.removeData('oldval')
				} else if (serverval === oldval) {
					cell.removeClass('corrected')
					cell.addClass('rejected')
					cell.attr('title', rec.error)
				} else {
					cell.data('userval', userval)
					g.val(cell, serverval)
					cell.removeData('oldval')
					cell.removeClass('rejected changed')
					cell.addClass('corrected')
					cell.attr('title', 'wanted: '+g.format_value(userval, g.field(ci)))
				}
			})
			// even if some cells got rejected and thus they're still marked
			// as "changed", the row itself is not changed until the user
			// changes at least one cell again.
			row.removeClass('changed')
		}
	}

	g.save = function() {

		var records = []
		g.rows().filter('.changed').each(function(_, row) {
			// collect modified values
			var values
			g.cells(row).each(function(ci, cell) {
				cell = $(cell)
				if (!cell.hasClass('changed')) return
				var val = g.val(cell)
				values = values || {}
				values[g.field(ci).name] = val
			})
			if (values) {
				var id = g.row_id(row)
				records.push({id: id, values: values})
			}
		})

		if (!records.length)
			return true

		g.save_records(records, update_records)
		return true
	}

	g.save_records = function(records, success) {} // stub

	// cell navigation --------------------------------------------------------

	g.near_cell = function(cell, rows, cols) {
		cell = cell || g.active_cell()
		rows = rows || 0
		cols = cols || 0

		if (!cell.length) return cell // no cells

		var ri = g.rowof(cell).index() + rows
		var ci = cell.index() + cols

		// end of the row: move to next-row-first-cell or last-row-last-cell.
		if (
			(cols < 0 && ci < 0) ||
			(cols > 0 && ci > g.col_count() - 1)
		) {
			ri = ri + sign(cols)
			if (ri < 0 || ri > g.row_count() - 1)
				return
			ci = -sign(cols) * 1/0
		}

		var nearcell = g.cell(ri, ci)
		if (nearcell.is(cell)) return cell // didn't move, prevent recursion

		// skip readonly cells and rows
		if (g.field(nearcell.index()).readonly) {
			var ri = g.rowof(nearcell).index()
			var ci = cell.index()
			return g.near_cell(nearcell, sign(rows), sign(cols))
		}

		return nearcell
	}

	g.move = function(rows, cols) {
		return g.activate_cell(g.near_cell(null, rows, cols))
	}

	// key bindings -----------------------------------------------------------

	$(document).keydown(function(e) {

		if (!g.active()) return

		var input = g.input()
		var caret = g.caret()

		// left and right arrows, tab and shift-tab: move left-right
		if (e.which == 37 || e.which == 39 || e.which == 9) {

			var cols =
				e.which == 9 ? (e.shiftKey ? -1 : 1) : (e.which == 37 ? -1 : 1)

			if (
				!input ||
				(e.altKey && e.shiftKey && !e.ctrlKey) ||
				g.quick_edit ||
				(g.immediate_mode &&
					g.focused() &&
					g.caret() == (cols < 0 ? 0 : input.val().length) &&
						(e.which == 9 || !e.shiftKey)
				)
			) {
				if (g.move(0, cols))
					if (input && g.immediate_mode)
						g.enter_edit(cols < 0 ? -1 : 0)
				e.preventDefault()
				return
			}

		}

		// up, down, page-up, page-down: move up-down
		if ((e.which == 38 || e.which == 33 || e.which == 40 || e.which == 34) &&
				(!input || g.immediate_mode || g.quick_edit)
		) {
			var rows
			switch(e.which) {
				case 38: rows = -1; break
				case 40: rows =  1; break
				case 33: rows = -g.page_rows; break
				case 34: rows =  g.page_rows; break
			}
			var selected = text_selected(input)
			if (g.move(rows, 0) && input && g.immediate_mode)
				g.enter_edit(caret, selected)
			e.preventDefault()
			return
		}

		// F2: enter edit mode
		if (!input && e.which == 113) {
			g.enter_edit(null, true)
			e.preventDefault()
			return
		}

		// enter: toggle edit mode, and move down on exit
		if (e.which == 13) {
			if (!input)
				g.enter_edit(null, true)
			else {
				g.exit_edit()
				g.move(1, 0)
			}
			e.preventDefault()
			return
		}

		// esc: exit edit mode
		if (input && e.which == 27) {
			g.exit_edit(true)
			e.preventDefault()
			return
		}

		// insert key: insert row
		if (!input && e.which == 45) {
			g.insert_row()
			e.preventDefault()
			return
		}

		// delete key: delete active row
		if (!input && e.which == 46) {
			g.delete_row()
			e.preventDefault()
			return
		}

	})

	// printable characters: enter quick edit mode
	$(document).keypress(function(e) {
		if (!g.active()) return
		if (e.charCode == 0) return
		if (e.ctrlKey  || e.metaKey || e.altKey) return
		if (g.input()) return
		g.enter_edit(null, true)
		g.quick_edit = true
	})

	// render -----------------------------------------------------------------

	g.render()

	// mouse bindings ---------------------------------------------------------

	function make_clickable() {
		g.grid.on('click', '.cell', function() {
			if (g.active() && this == g.active_cell()[0])
				g.enter_edit(-1, true)
			else {
				if (g.activate())
					if (g.activate_cell(this))
						if (g.immediate_mode)
							g.enter_edit(-1, true)
			}
		})

		g.grid.on('click', '.field', function() {
			if (!g.activate()) return
			var ci = $(this).index()
			var field = g.field(ci)
			g.fetch(field.name+':'+(field.sort == 'asc' ? 'desc' : 'asc'))
		})

	}

	// activate first cell ----------------------------------------------------

	g.activate_cell(g.cell(0, 0))
	if (g.immediate_mode)
		g.enter_edit(-1, true)

	return g
}

action.grid = function() {

	listen('usr.grid.current_action', function() {
		allow(admin())
	})

	$('#layout').html('<div id=main></div>')
	$('body').css('margin-left', 0)

	var args = Array.prototype.slice.call(arguments)
	for (var i = 0; i < args.length; i++)
		args[i] = encodeURIComponent(args[i])

	function load(orderby) {

		var url = '/dataset.json/'+args.join('/')+location.search+
			(orderby ? (location.search ? '&' : '?')+'sort='+orderby : '')

		load_main(url, function(g_) {

			var g = grid($.extend(true, {
				immediate_mode: true,
			}, g_))

			g.fetch = load

			var url = '/dataset.json/'+args.join('/')+'/update'+location.search
			g.save_records = function(records, success) {
				post(url, {records: records}, function(data) {
					success(data.records)
				})
			}

		})
	}
	load()

	$('#main').after('<br><br><div id=d2 style="width: 500px; height: 300px"></div>')
	var g = grid({
		dst: '#d2',
		fields: [
			{name: 'id', readonly: true, },
			{name: 'name', type: 'text', maxlength: 16, default: 'default name', },
			{name: 'count', type: 'number', decimals: 2, },
		],
		values: [[1, 'foo', 0], [2, 'bar', null]],
		fieldmap: [2, 0, 1],
	})
	g.activate()

}

return grid
})()
