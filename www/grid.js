(function() {

function grid(data, dst) {

	dst = $(dst)

	var g = {
		page_rows: 20,
	}

	// rendering --------------------------------------------------------------

	function clean_data(data) {
		for (var i = 0; i < data.rows.length; i++) {
			var row = data.rows[i]
			for (var j = 0; j < data.fields.length; j++) {
				if (!row[j])
					row[j] = 'null'
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
	}

	function select_row(row, caret) {
		if (!row.length) return
		select_row_only(row)
		g.selected_col(g.selected_col() || 0, caret)
	}
	g.selected_row = function(i, caret) {
		if (typeof i != 'number')
			return active_row ? active_row.index() : null
		if (i < 0) return
		var row = grid.find('>tbody>tr:nth-child('+(i+1)+')')
		select_row(row, caret)
	}
	g.row_count = function() {
		return grid.find('>tbody>tr').length
	}

	// cell selection ---------------------------------------------------------

	var active_cell
	var active_input
	function select_cell(cell, caret) {
		if (!cell.length) return

		// remove the input on the active cell
		if (active_cell) {
			active_cell.find('span').html(active_input.val())
			active_cell.find('div').html('')
		}

		// compute the dimensions of the input box based on text width and cell height.
		// the edit box outer width should not exceed text width, to avoid reflowing.
		var span = cell.find('>span')
		var val = span.html().trim()
		var w = cell.width()
		var h = cell.height()-1

		// create the input box and focus it
		cell.find('div').html('<input type=text class=input style="width: '+w+'px; height: '+h+'px;" value="' + val + '">')
		var input = cell.find('input')
		input.focus()

		// set globals
		active_cell = cell
		active_input = input
		active_input.caret(caret)
	}
	g.selected_col = function(i, caret) {
		if (typeof i != 'number')
			return active_cell ? active_cell.index() : null
		if (i < 0) return
		if (!active_row) return
		var cell = active_row.find('>td:nth-child('+(i+1)+')')
		select_cell(cell, caret)
	}
	g.active_input = function() {
		return active_input
	}

	// key bindings -----------------------------------------------------------

	$(document).keydown(function(e) {
		var altshift = e.altKey && e.shiftKey
		if (e.which == 39 && (altshift || (
					active_input.is(':focus') &&
					active_input.caret() == active_input.val().length &&
					!e.shiftKey)
		)) {
			// right
			g.selected_col(g.selected_col() + 1, 0)
			e.preventDefault()
		} else if (e.which == 37 && (altshift || (
					active_input.is(':focus') &&
					active_input.caret() == 0 &&
					!e.shiftKey)
		)) {
			// left
			g.selected_col(g.selected_col() - 1, -1)
			e.preventDefault()
		} else if (e.which == 38) {
			// up
			g.selected_row(g.selected_row() - 1, active_input.caret())
			e.preventDefault()
		} else if (e.which == 40) {
			// down
			g.selected_row(g.selected_row() + 1, active_input.caret())
			e.preventDefault()
		} else if (e.which == 33) {
			// page up
			var row = Math.max(0, g.selected_row() - g.page_rows)
			g.selected_row(row, active_input.caret())
		} else if (e.which == 34) {
			// page down
			var row = Math.min(g.row_count()-1, g.selected_row() + g.page_rows)
			g.selected_row(row, active_input.caret())
		} else {
			console.log(e.which)
		}
	})

	// mouse bindings ---------------------------------------------------------

	grid.find('>tbody td').click(function() {
		if (active_cell[0] == this) return
		select_row_only($(this).parent())
		select_cell($(this), 0)
	})

	grid.find('>thead th').click(function() {
		var col = $(this).index()
		console.log(col)
	})

	// select first row and return --------------------------------------------

	g.selected_row(0)

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

	var url = '/dataset.json/'+args.join('/')+location.search
	load_main(url, function(data) {
		var gr = grid(data, '#main')
	})
}

})()
