(function() {

action.grid = function() {

	listen('usr.grid.current_action', function() {
		allow(admin())
	})

	$('#layout').html('<div id=main></div>')

	function clean_data(data) {
		for (var i = 0; i < data.rows.length; i++) {
			var row = data.rows[i]
			for (var j = 0; j < data.fields.length; j++) {
				if (!row[j])
					row[j] = 'null'
			}
		}
	}

	function update_grid(data) {
		clean_data(data)
		render('grid', data, '#main')

		var grid = $('#main table.grid')

		var active_row
		var active_cell
		var active_input

		function select_row(row, caret) {
			if (!row.length) return

			if (active_row)
				active_row.removeClass('selected')
			row.addClass('selected')

			active_row = row

			// move active cell
			var index = active_cell && active_cell.index() || 0
			var cell = active_row.find('>td:nth-child('+(index+1)+')')
			set_edit(cell, caret)
		}
		var row = grid.find('>tbody>tr:first-child')
		select_row(row)

		function set_edit(cell, caret) {
			if (!cell.length) return

			// remove the input on the active cell
			if (active_cell)
				active_cell.html('<span>'+active_cell.find('>input').val()+'</span>')

			// compute the dimensions of the input box based on text width and cell height.
			// the edit box outer width should not exceed text width, to avoid reflowing.
			var span = cell.find('>span')
			var val = span.html().trim()
			var w = span.width()
			var h = cell.height()-1

			// create the input box and focus it
			cell.html('<input type=text class=input style="width: '+w+'px; height: '+h+'px;" value="' + val + '">')
			var input = cell.find('>input')
			input.focus()

			// set globals
			active_cell = cell
			active_input = input
			active_input.caret(caret)
		}
		var cell = active_row.find('>td:first-child')
		set_edit(cell, -1)

		$(document).keydown(function(e) {
			var altshift = e.altKey && e.shiftKey
			if (e.which == 39 && (altshift || (
						active_input.is(':focus') &&
						active_input.caret() == active_input.val().length)
			)) {
				// right
				set_edit(active_cell.next(), 0)
				e.preventDefault()
			} else if (e.which == 37 && (altshift || (
						active_input.is(':focus') &&
						active_input.caret() == 0)
			)) {
				// left
				set_edit(active_cell.prev(), -1)
				e.preventDefault()
			} else if (e.which == 38) {
				// up
				select_row(active_row.prev(), active_input.caret())
				e.preventDefault()
			} else if (e.which == 40) {
				// down
				select_row(active_row.next(), active_input.caret())
				e.preventDefault()
			}
		})

	}

	var args = Array.prototype.slice.call(arguments)
	for (var i = 0; i < args.length; i++)
		args[i] = encodeURIComponent(args[i])

	var url = '/dataset.json/'+args.join('/')+location.search
	load_main(url, update_grid)
}

})()
