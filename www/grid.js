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

function grid(g) {

	var g = $.extend(true, {
		dst: '#main',
		page_rows: 20,
		immediate_mode: false,
	}, g)

	// row by id --------------------------------------------------------------

	var idfield_index

	function get_field_index(fieldname) {
		for (var j = 0; j < g.fields.length; j++)
			if (g.fields[j].name == fieldname)
				return j
	}

	var idmap = {} // id: row

	function make_idmap(data) {
		var rows = g.rows()
		for (var i = 0; i < g.values.length; i++) {
			var row = g.values[i]
			var id = row[idfield_index]
			idmap[id] = rows[i]
		}
	}

	g.rowbyid = function(id) {
		return idmap[id]
	}

	// rendering --------------------------------------------------------------

	var toClass = {}.toString

	g.fmt_value = function() {
		return (this === Mustache.NULL || this === window) ? 'null' : this
	}

	g.value_type = function() {
		return this === Mustache.NULL ? 'null' :
			(toClass.call(this).match(/ (\w+)\]/)[1]).toLowerCase()
	}

	function set_classes() {
		g.cells().each(function(_, cell) {
			cell = $(cell)
			var col = cell.index()
			var row = g.rowof(cell).index()
			var field = g.fields[col]
			if (field.readonly)
				cell.addClass('readonly')
			if (field.align)
				cell.attr('align', field.align)
		})
	}

	g.render = function() {
		var dst = $(g.dst)
		idfield_index = get_field_index(g.idfield)
		render('grid', g, dst)
		g.grid = dst.find('.grid')
		make_idmap(g.data)
		set_classes()
	}

	// selectors --------------------------------------------------------------

	g.row_count = function() { return g.values.length; }
	g.col_count = function() { return g.fields.length; }

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
			v.html(g.fmt_value.call(val))
			v.removeClass('null string number boolean')
			v.addClass(g.value_type.call(val))
			return curval // return the replaced value
		}
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
		active_row.removeClass('active')
		g.deselect_rows(active_row)
		active_row = $([])
		return true
	}

	g.activate_row = function(row) {
		row = $(row)
		if (!row.length) return // no row
		if (active_row.is(row)) return // same row
		if (!g.deactivate_row()) return
		g.select_rows(row)
		row.addClass('active')
		active_row = row
		return true
	}

	g.active_row = function(row) {
		if (!row) return active_row
		return g.activate_row(row)
	}

	// cell focusing ----------------------------------------------------------

	var active_cell = $([])

	g.deactivate_cell = function() {
		if (!g.exit_edit()) return
		active_cell.removeClass('active')
		active_cell = $([])
		return true
	}

	g.activate_cell = function(cell) {
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
		div.html('<input type=text class=input style="width: '+w+'px; height: '+h+'px;">')
		var input = div.find('input')
		if (field.maxlength)
			input.attr('maxlength', field.maxlength)
		input.val(val)
		input.focus()
		if (is(caret))
			input.caret(caret)
		if (select)
			input.select()
		active_cell.addClass('edit')
		active_input = input
		return input
	}

	g.exit_edit = function(cancel) {
		if (!active_input)
			return true
		var cell = active_cell
		if (!cancel) {
			var curval = g.val(active_cell)
			var newval = g.cast(active_input.val().trim(), active_cell.index())
			if (newval !== curval) {
				g.val(cell, newval)
				cell.removeClass('rejected corrected')
				var oldval = cell.data('oldval')
				if (newval !== oldval) {
					cell.addClass('changed')
					if (oldval === undefined) {
						cell.data('oldval', curval)
						cell.attr('title', 'old value: '+g.fmt_value.call(curval))
					}
				} else
					cell.removeClass('changed')
			}
		}
		cell.removeClass('edit')
		cell.find('.input_div').html('')
		active_input = null
		g.quick_edit = null
		return true
	}

	// cell navigation --------------------------------------------------------

	g.near_cell = function(rows, cols) {
		rows = rows || 0
		cols = cols || 0
		if (rows && cols) return // can't move in two directions at once
		var rowindex = g.active_row().index() + rows
		var cellindex = g.active_cell().index() + cols
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
					cell.removeClass('changed rejected corrected')
					cell.removeData('oldval')
				} else if (serverval === oldval) {
					cell.removeClass('changed corrected')
					cell.addClass('rejected')
					cell.attr('title', rec.error)
				} else {
					cell.data('userval', userval)
					g.val(cell, serverval)
					cell.removeData('oldval')
					cell.removeClass('changed rejected')
					cell.addClass('corrected')
					cell.attr('title', 'wanted: '+g.fmt_value.call(userval))
				}
			})
		}
	}

	g.save = function() {

		var records = []
		g.rows().each(function(i, row) {
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

	// key bindings -----------------------------------------------------------

	$(document).keydown(function(e) {

		var input = g.input()
		var caret = g.caret()

		// left and right arrows
		if ((e.which == 37 || e.which == 39) && (
				!input ||
					((g.immediate_mode || g.quick_edit) && (
						(e.altKey && e.shiftKey && !e.ctrlKey) || (
							g.focused() &&
							g.caret() == (e.which == 37 ? 0 : input.val().length) &&
							!e.shiftKey))))
		) {
			if (g.move(0, e.which == 37 ? -1 : 1) && input && g.immediate_mode)
				g.enter_edit(e.which == 37 ? -1 : 0)
			e.preventDefault()
			return
		}

		// up, down, page-up, page-down
		if ((e.which == 38 || e.which == 33 ||
				e.which == 40 || e.which == 34
			) && (!input || g.immediate_mode || g.quick_edit)
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

		// enter or F2
		if (e.which == 13 || e.which == 113) {
			if (!input)
				g.enter_edit(null, true)
			else if (e.which == 13)
				g.exit_edit()
			e.preventDefault()
			return
		}

		// esc
		if (e.which == 27) {
			g.exit_edit(true)
			e.preventDefault()
			return
		}

	})

	// printable characters: enter quick edit mode
	$(document).keypress(function(e) {
		if (e.charCode == 0) return
		if (e.ctrlKey  || e.metaKey || e.altKey) return
		if (g.input()) return
		g.enter_edit(null, true)
		g.quick_edit = true
	})

	// render -----------------------------------------------------------------

	g.render()

	// mouse bindings ---------------------------------------------------------

	g.cells().click(function() {
		if (this == g.active_cell()[0])
			g.enter_edit(-1, true)
		else if (g.activate_cell(this))
			if (g.immediate_mode)
				g.enter_edit(-1, true)
	})

	g.cols().click(function() {
		var i = $(this).index()
		g.fetch(g.fields[i].name + ':' +
			(g.fields[i].sort == 'asc' ? 'desc' : 'asc'))
	})

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

}

})()
