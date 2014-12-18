(function() {

function is(arg) {
	return arg !== undefined && arg !== null
}

function grid(data, dst, g) {

	dst = $(dst)

	var g = $.extend({
		page_rows: 20,
		immediate_mode: false,
	}, g)

	// rendering --------------------------------------------------------------

	function clean_data(data) {
		for (var i = 0; i < data.rows.length; i++) {
			var row = data.rows[i]
			for (var j = 0; j < data.fields.length; j++) {
				if (!row[j])
					row[j] = '&nbsp;' // prevent the template from skipping the cell
			}
		}
	}
	clean_data(data)

	render('grid', data, dst)

	// selectors --------------------------------------------------------------

	g.row_count = function() { return data.rows.length; }
	g.col_count = function() { return data.fields.length; }

	g.grid = dst.find('.grid')

	g.rows = function() { return g.grid.find('.row'); }
	g.row = function(i) {
		i = Math.min(Math.max(i, 0), g.row_count() - 1)
		return g.rows().filter(':nth-child('+(i+1)+')')
	}
	g.cells = function(row) { return (row || g.grid).find('.cell'); }
	g.cell = function(row, i) {
		if (typeof row == 'number')
			row = g.row(row)
		i = Math.min(Math.max(i, 0), g.col_count() - 1)
		return row.find('.cell:nth-child('+(i+1)+')')
	}
	g.fields = function() { return g.grid.find('.field'); }
	g.cellrow = function(cell) { return cell.parent(); }

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
		if (!g.cellrow(cell).is(g.active_row())) { // diff. row
			if (!g.activate_row(g.cellrow(cell)))
				return
		} else { // same row
			if(!g.deactivate_cell())
				return
		}
		cell.addClass('active')
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

	function is_modified(cell) {
		return $(this).data('oldval') !== undefined
	}
	g.modified_cells = function(cell) {
		return g.cells().filter(is_modified)
	}

	g.enter_edit = function(caret, select) {
		if (active_input) return input
		var cell = active_cell
		if (!cell.length) return
		var val = cell.find('.value').html().trim()
		var w = cell.width()
		var h = cell.height()
		var div = cell.find('.input_div')
		div.html('<input type=text class=input style="width: '+w+'px; height: '+h+'px;">')
		var input = div.find('input')
		input.val(val)
		input.focus()
		if (is(caret))
			input.caret(caret)
		if (select)
			input.select()
		active_input = input
		return input
	}

	g.exit_edit = function(cancel) {
		if (!active_input)
			return true
		if (!cancel) {
			var val = active_input.val().trim()
			var span = active_cell.find('.value')
			var oldval = span.html().trim()
			if (val != oldval) {
				if (!g.save_cell(active_cell, val, oldval))
					return
				span.html(val)
				active_cell.data('oldval', oldval)
			}
		}
		active_cell.find('.input_div').html('')
		active_input = null
		return true
	}

	// cell navigation --------------------------------------------------------

	g.near_cell = function(rows, cols) {
		var rowindex = g.active_row().index() + (rows || 0)
		var cellindex = g.active_cell().index() + (cols || 0)
		return g.cell(rowindex, cellindex)
	}

	g.move = function(rows, cols) {
		return g.activate_cell(g.near_cell(rows, cols))
	}

	// saving data ------------------------------------------------------------

	g.exit_row = function(row) { return true; } // stub
	g.save_cell = function(row, col, val, oldval) { return true; } // stub

	g.save = function() {
		g.modified_cells().each(function() {
			//
		})
	}

	// code all policy below this line and only using the g.* api -------------
	// ------------------------------------------------------------------------

	// key bindings -----------------------------------------------------------

	$(document).keydown(function(e) {

		var shift = e.shiftKey
		var altshift = e.altKey && shift
		var input = g.input()
		var caret = g.caret()

		if (e.which == 39 && (
				!input ||
					(g.immediate_mode && (
						altshift || (
							g.focused() &&
							g.caret() == input.val().length &&
							!shift))))
		) {
			// right arrow
			if (g.move(0, 1) && input && g.immediate_mode)
				g.enter_edit(0)
			e.preventDefault()
		} else if (e.which == 37 && (
				!input ||
					(g.immediate_mode && (
						altshift || (
							g.focused() &&
							g.caret() == 0 &&
							!shift))))
		) {
			// left arrow
			if (g.move(0, -1) && input && g.immediate_mode)
				g.enter_edit(-1)
			e.preventDefault()
		} else if (
			e.which == 38 || e.which == 33 || // up, page-up
			e.which == 40 || e.which == 34    // down, page-down
		) {
			if (input && !g.immediate_mode) return
			var rows
			switch(e.which) {
				case 38: rows = -1; break
				case 40: rows =  1; break
				case 33: rows = -g.page_rows; break
				case 34: rows =  g.page_rows; break
			}
			if (g.move(rows, 0) && input && g.immediate_mode)
				g.enter_edit(caret)
			e.preventDefault()
		} else if (e.which == 13 || e.which == 113) {
			// enter or F2
			if (!input)
				g.enter_edit(-1, true)
			else if (e.which == 13)
				g.exit_edit()
			e.preventDefault()
		} else if (e.which == 27) {
			// esc
			g.exit_edit(true)
			e.preventDefault()
		}
	})

	// mouse bindings ---------------------------------------------------------

	g.cells().click(function() {
		g.activate_cell(this)
	})

	g.fields().click(function() {
		var i = $(this).index()
		g.fetch(data.fields[i].name + ':' +
			(data.fields[i].sort == 'asc' ? 'desc' : 'asc'))
	})

	// select first row and return --------------------------------------------

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

	var args = Array.prototype.slice.call(arguments)
	for (var i = 0; i < args.length; i++)
		args[i] = encodeURIComponent(args[i])

	function load(orderby) {
		var url = '/dataset.json/'+args.join('/')+location.search+
			(orderby ? (location.search ? '&' : '?')+'sort='+orderby : '')
		load_main(url, function(data) {
			var g = grid(data, '#main', {
				immediate_mode: true,
			})
			g.fetch = load
		})
	}
	load()

}

})()
