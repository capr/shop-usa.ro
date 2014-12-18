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

	var grid = dst.find('table.grid')

	// row selection ----------------------------------------------------------

	var active_row

	function select_row_only(row) {
		if (!row.length) return
		if (active_row)
			active_row.removeClass('selected')
		row.addClass('selected')
		active_row = row
		return true
	}

	function select_row(row) {
		if (!row.length) return
		var selected = select_row_only(row)
		g.selected_col(active_cell ? g.selected_col() : 0)
		return selected
	}

	// select a row by index, or return the index of the selected row.
	g.selected_row = function(i) {
		if (!is(i))
			return active_row ? active_row.index() : null
		if (i < 0) return
		var row = grid.find('>tbody>tr:nth-child('+(i+1)+')')
		return select_row(row)
	}

	g.row_count = function() {
		return grid.find('>tbody>tr').length
	}

	// cell selection ---------------------------------------------------------

	var active_cell

	function select_cell(cell) {
		if (!cell.length) return
		g.exit_edit()
		if (active_cell)
			active_cell.removeClass('selected')
		cell.addClass('selected')
		active_cell = cell
		return true
	}

	// select a column in the selected row by index, or return the index
	// of the selected column.
	g.selected_col = function(i) {
		if (!is(i))
			return active_cell ? active_cell.index() : null
		if (!active_row) return
		if (i < 0) return
		var cell = active_row.find('>td:nth-child('+(i+1)+')')
		return select_cell(cell)
	}

	// select a cell, potentially changing both the selected row and column.
	g.selected_cell = function(cell) {
		cell = $(cell)
		if (cell[0] == active_cell[0]) return // already selected
		select_row_only(cell.parent())
		return select_cell(cell)
	}

	g.cells = function() { return grid.find('>tbody td'); }
	g.headcells = function() { return grid.find('>thead th'); }

	// cell editing -----------------------------------------------------------

	var active_input

	function enter_edit() {
		if (active_input) return
		exit_edit()
		var cell = active_cell
		if (!cell) return
		// compute the dimensions of the input box based on text width and cell height.
		// the edit box outer width should not exceed text width, to avoid reflowing.
		var val = cell.find('>span').html().trim()
		var w = cell.width()
		var h = cell.height() - 1
		cell.find('div').html('<input type=text class=input style="width: '+w+'px; height: '+h+'px;" value="' + val + '">')
		var input = cell.find('input')
		input.focus()
		active_input = input
		return input
	}

	function exit_edit(cancel) {
		if (!active_input) return
		if (!cancel) {
			var val = active_input.val()
			active_cell.find('span').html(val)
		}
		active_cell.find('div').html('')
		active_input = null
	}

	g.input = function() { return active_input; }
	g.caret = function(caret) {
		return active_input &&
			(is(caret) ? active_input.caret(caret) : active_input.caret())
	}
	g.focused = function() { return active_input && active_input.is(':focus'); }
	g.enter_edit = enter_edit
	g.exit_edit = exit_edit

	// key bindings -----------------------------------------------------------

	$(document).keydown(function(e) {

		var shift = e.shiftKey
		var altshift = e.altKey && shift
		var input = g.input()
		var caret = g.caret()

		if (e.which == 39 && (
				!input || !g.immediate_mode ||
					(g.immediate_mode && (
						altshift || (
							g.focused() &&
							g.caret() == input.val().length &&
							!shift))))
		) {
			// right arrow
			var selected = g.selected_col(g.selected_col() + 1)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(0)
			}
			e.preventDefault()
		} else if (e.which == 37 && (
				!input || !g.immediate_mode ||
					(g.immediate_mode && (
						altshift || (
							g.focused() &&
							g.caret() == 0 &&
							!shift))))
		) {
			// left arrow
			var selected = g.selected_col(g.selected_col() - 1)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(-1)
			}
			e.preventDefault()
		} else if (e.which == 38) {
			// up arrow
			var selected = g.selected_row(g.selected_row() - 1)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(caret)
			}
			e.preventDefault()
		} else if (e.which == 40) {
			// down arrow
			var selected = g.selected_row(g.selected_row() + 1)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(caret)
			}
			e.preventDefault()
		} else if (e.which == 33) {
			// page up
			var row = Math.max(0, g.selected_row() - g.page_rows)
			var selected = g.selected_row(row)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(caret)
			}
		} else if (e.which == 34) {
			// page down
			var row = Math.min(g.row_count() - 1, g.selected_row() + g.page_rows)
			var selected = g.selected_row(row)
			if (input && selected && g.immediate_mode) {
				g.enter_edit()
				g.caret(caret)
			}
		} else if (e.which == 13 || e.which == 113) {
			// enter or F2
			if (!input) {
				input = enter_edit()
				if (input) {
					input.caret(-1)
					input.select()
				}
			} else if (e.which == 13)
				exit_edit()
		} else if (e.which == 27) {
			// esc
			exit_edit(true)
		}
	})

	// mouse bindings ---------------------------------------------------------

	g.cells().click(function() {
		g.selected_cell(this)
	})

	g.headcells().click(function() {
		var i = $(this).index()
		g.fetch(data.fields[i].name + ':' +
			(data.fields[i].sort == 'asc' ? 'desc' : 'asc'))
	})

	// select first row and return --------------------------------------------

	g.selected_row(0)
	if (g.immediate_mode)
		g.enter_edit()

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
