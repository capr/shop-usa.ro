(function() {

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
		fields: [
			{name: 'id', readonly: true, },
			{name: 'name', type: 'text', maxlength: 16, default: 'default name', },
			{name: 'count', type: 'number', decimals: 2, },
		],
		values: [[1, 'foo', 0], [2, 'bar', null]],
	}, g)

	// id->row map ------------------------------------------------------------

	var idfield_index

	function get_field_index(fieldname) {
		for (var j = 0; j < g.fields.length; j++)
			if (g.fields[j].name == fieldname)
				return j
	}

	var idmap = {} // id: row

	function make_idmap() {
		var rows = g.rows()
		for (var i = 0; i < g.values.length; i++) {
			var row = g.values[i]
			var id = row[idfield_index]
			idmap[id] = rows[i]
		}
	}

	g.rowbyid = function(id) {
		return $(idmap[id])
	}

	// rendering --------------------------------------------------------------

	var format_value = function(v, field) {
		return (v === null) ? 'null' : v
	}

	var value_type = function(v, field) {
		return v === null ? 'null' : (typeof v)
	}

	g.format_value = format_value
	g.value_type = value_type

	function render_context(fields, values) {

		var t = {}
		var row, col
		var val = {}

		var ft = []
		$.each(fields, function(i, f) {
			ft.push($.extend({
				index: i,
				align: 'left',
			}, f))
		})
		t.fields = ft
		t.rows = values

		t.cols = function(r) {
			col = 0
			row = r
			return r
		}

		t.col = function() {
			val.field = fields[col]
			val.raw = row[col]
			col++
			return val
		}

		val.value = function(v) { return format_value(v.raw, v.field); }
		val.type = function(v) { return value_type(v.raw); }
		val.readonly = function(v) { return v.field.readonly ? 'readonly' : ''; }
		val.align = function(v) { return v.field.align; }

		return t
	}

	g.render = function() {
		var dst = $(g.dst)
		idfield_index = get_field_index(g.idfield) || 0
		var t = render_context(g.fields, g.values)
		render('grid', t, dst)
		g.grid = dst.find('.grid')
		make_idmap()
		make_clickable()
	}

	// selectors --------------------------------------------------------------

	g.row_count = function() { return g.values.length; }
	g.col_count = function() { return g.fields.length; }

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

	g.cast = function(val, col) {
		var field = g.fields[col]
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
		var col = cell.index()
		var row = g.rowof(cell).index()
		var curval = g.values[row][col]
		if (val === undefined) // get it
			return curval
		if (val !== curval) { // set it
			val = g.cast(val, col)
			g.values[row][col] = val
			var v = cell.find('.value')
			v.html(g.format_value(val, g.fields[col]))
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
		//g.prev_active_cell = g.deactivate_cell()
		//g.deactivate_row()
		//if (!g.prev_active_cell) return
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
		//g.activate_cell(g.prev_active_cell)
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
		var field = g.fields[cell.index()]
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
			var col = active_cell.index()
			var curval = g.val(active_cell)
			var newval = g.cast(active_input.val().trim(), col)
			if (newval !== curval) {
				g.val(cell, newval)
				cell.removeClass('rejected corrected')
				var oldval = cell.data('oldval')
				if (newval !== oldval) {
					cell.addClass('changed')
					if (oldval === undefined) {
						cell.data('oldval', curval)
						cell.attr('title', 'old value: '+g.format_value(curval, g.fields[col]))
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

	g.insert_row = function(rowindex) {

		// range-check & default rowindex
		if (!is(rowindex))
			rowindex = g.active_row().index()
		rowindex = clamp(rowindex, 0, g.row_count())
		var append = rowindex == g.row_count()

		// make a new record with default values
		var rec = []
		for (var i = 0; i < g.fields.length; i++)
			rec.push(g.fields[i]['default'] || null)

		// add it to the values table
		g.values.splice(rowindex, 0, rec)

		// render it, add it to position, and get it
		var s = render('grid_rows', render_context(g.fields, [rec]))
		if (append)
			g.rows_ct().append(s)
		else
			g.row(rowindex).before(s)

		var row = g.row(rowindex)
		var cells = g.cells(row)

		// activate the row on the same cell as before
		g.activate_cell(g.cell(row, g.active_cell().index()))

		// mark non-null cells and the row as changed
		$.each(g.values[rowindex], function(i, val) {
			if (val !== null) {
				g.cell(row, i).addClass('changed')
				row.addClass('changed')
			}
		})

		// mark all cells and the row as new
		cells.addClass('new')
		row.addClass('new')
	}

	g.delete_row = function(rowindex) {

		// range-check & default rowindex
		if (!is(rowindex))
			rowindex = g.active_row().index()
		if (rowindex < 0 || rowindex >= g.row_count())
			return

		/*
		// make a new record with default values
		g.values.rowindex

		// add it to the values table
		g.values.splice(rowindex, 0, rec)

		// render it, add it to position, and get it
		var s = render('grid_rows', render_context(g.fields, [rec]))
		if (append)
			g.rows_ct().append(s)
		else
			g.row(rowindex).before(s)
		var row = g.row(rowindex)

		// activate the row on the same cell as before
		g.activate_cell(g.cell(row, g.active_cell().index()))

		// mark non-null cells as changed
		$.each(g.values[rowindex], function(i, val) {
			if (val !== null)
				g.cell(row, i).addClass('changed')
		})

		// mark all cells and the row as new
		g.cells(row).addClass('new')
		row.addClass('new')

		// mark the row as changed
		row.addClass('changed')
		*/
	}

	// saving data ------------------------------------------------------------

	g.exit_row = function(row) {
		return g.exit_edit() && g.save()
	}

	function update_records(records) {
		for (var i = 0; i < records.length; i++) {
			var rec = records[i]
			var row = g.rowbyid(rec.id)
			g.cells(row).each(function(i, cell) {
				cell = $(cell)
				var serverval = rec.values[i]
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
					cell.attr('title', 'wanted: '+g.format_value(userval, g.fields[i]))
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
			g.cells(row).each(function(j, cell) {
				cell = $(cell)
				if (!cell.hasClass('changed')) return
				var val = g.val(cell)
				values = values || {}
				values[g.fields[j].name] = val
			})
			if (values) {
				var id = g.val(g.cell(row, idfield_index))
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

	g.near_cell = function(rows, cols) {
		rows = rows || 0
		cols = cols || 0
		var rowindex = g.active_row().index() + rows
		var cellindex = g.active_cell().index() + cols

		if (
			(cols < 0 && cellindex < 0) ||
			(cols > 0 && cellindex > g.col_count() - 1)
		) {
			rowindex = rowindex + sign(cols)
			if (rowindex < 0 || rowindex > g.row_count() - 1)
				return
			cellindex = -sign(cols) * 1/0
		}

		var cell = g.cell(rowindex, cellindex)
		if (cell.is(g.active_cell)) return cell // didn't move, prevent recursion
		// skip hidden cells and rows
		if (!cell.is(':visible') || !g.row(rowindex).is(':visible')) {
			return g.near_cell(rows + sign(rows), cols + sign(cols))
		}
		return cell
	}

	g.move = function(rows, cols) {
		return g.activate_cell(g.near_cell(rows, cols))
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
			e.delete_row()
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
			console.log('click')
			if (g.activate())
				if (g.activate_cell(this))
					if (g.immediate_mode)
						g.enter_edit(-1, true)
			}
		})

		g.grid.on('click', '.field', function() {
			if (!g.activate()) return
			var i = $(this).index()
			var field = g.fields[i]
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
				//immediate_mode: true,
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
	var g = grid({dst: '#d2'})
	g.activate()

}

})()
