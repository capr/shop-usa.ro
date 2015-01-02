var grid = (function() {

// helpers -------------------------------------------------------------------

function sign(x) {
	return x > 0 ? 1 : x < 0 ? -1 : 0
}

function assert(t, err) {
	if (t == null || t == false)
		throw (err || 'assertion failed')
	return t
}

function clamp(x, x0, x1) {
	return Math.min(Math.max(x, x0), x1)
}

function make_url(path, opt_args, opt_params) {
	var args = []
	for (var i in opt_args)
		args.push(encodeURIComponent(opt_args[i]))
	args = args.join('/')

	var params = []
	for (var k in opt_params)
		params.push(encodeURIComponent(k)+'='+encodeURIComponent(opt_params[k]))
	params = params.join('&')

	return path+(args?'/'+args:'')+(params?'?'+params:'')
}

// check if the text in an input box is fully selected.
function fully_selected(input) {
	if (!input) return
	var p0 = input[0].selectionStart
	var p1 = input[0].selectionEnd
	return p0 == 0 && p1 == input.val().length
}

// grid ----------------------------------------------------------------------

var active_grid // the grid that gets keyboard input

function grid(g_opt) {

	// data model <-> rendering model (i.e. all you need to know):
	//
	// data vocabulary: field, record, value; row index (ri), field index (fi).
	// rendering vocabulary: row, cell, col; row index (ri), col index (ci).
	//
	// g.fields[fi] -> field (field definitions, in field order)
	// g.values[ri] -> record; record[fi] -> value (raw values, in field order)
	// g.fieldmap[ci] -> fi (column index -> field index mapping)
	// g.row(ri) -> row (row selector)
	// g.cell(ri, ci) -> cell (value cell selector; only fieldmap values are rendered)
	// g.hcell(ci) -> hcell (header cell selector; only fieldmap hcells are rendered)
	// g.row_id(row) -> id (per g.idfield_name or g.idfield_index)
	// g.row_byid(id) -> row (per g.idmap)

	var g = {
		// data
		fields: [],               // [{name:, width:, ...}]
		values: [],               // [[v11,v12,...],[v21,v22,...],...]
		// rendering
		fieldmap: null,           // [ci: fi] (created automatically if missing)
		container: null,          // rendering container selector (required)
		// behavior
		page_rows: 20,            // how many rows to move on page-down/page-up
		immediate_mode: false,    // stay in edit mode while navigating
		save_on_exit_row: true,   // trigger save on vertical movement
		save_on_exit_edit: false, // trigger save when done editing each cell
		// load/save
		url_path: null,           // URL path (enables loading and saving)
		url_args: [],             // encoded and appended to URL path
		url_params: {},           // URL query params
	}

	// record id -> row map ---------------------------------------------------

	function fieldindex_byname(fieldname) {
		for (var i = 0; i < g.fields.length; i++)
			if (g.fields[i].name == fieldname)
				return i
	}

	var idmap // id: row
	var id_fi

	function init_idmap() {
		id_fi = g.idfield_name ?
			assert(fieldindex_byname(g.idfield_name), 'wrong idfield_name') :
			(g.idfield_index || 0)
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

	// col index <-> field index mappings -------------------------------------

	function init_fieldmap() {
		if (g.fieldmap) return
		g.fieldmap = []
		for (var i in g.fields)
			g.fieldmap.push(i)
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

	g.render_context = function(values) {

		var t = {}
		var rec, ci
		var val = {}

		t.width = g.width

		var ft = []
		$.each(g.fieldmap, function(ci, fi) {
			ft.push($.extend({
				index: ci,
				align: 'left',
			}, g.fields[fi]))
		})

		$.each(ft, function(i, f) {
			f['align_'+f.align] = true
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

	g.template = function(name) {
		return $('#' + name + '_template').html()
	}

	g.render_template = function(template, values) {
		var ctx = g.render_context(values)
		return Mustache.render(g.template(template), ctx, g.template)
	}

	g.render = function() {
		var container = $(g.container)
		assert(container.length == 1, 'container not found')
		init_fieldmap()
		var s = g.render_template('grid', g.values)
		container.html(s)
		g.grid = container.find('.grid')
		init_idmap()
		make_clickable()
	}

	// selectors --------------------------------------------------------------

	g.row_count = function() { return g.values.length; }
	g.col_count = function() { return g.fieldmap.length; }

	g.rows_ct = function() { return g.grid.find('.rows'); }
	g.rows = function() { return g.grid.find('.row'); }
	g.changed_rows = function() { return g.grid.find('.row.changed'); }
	g.row = function(i) {
		i = clamp(i, 0, g.row_count() - 1)
		return g.rows().filter(':nth-child('+(i+1)+')')
	}
	g.cells = function(row) { return (row ? $(row) : g.grid).find('.cell'); }
	g.changed_cells = function(row) { return (row ? $(row) : g.grid).find('.cell.changed'); }
	g.cell = function(row, i) {
		if (typeof row == 'number')
			row = g.row(row)
		else
			row = $(row)
		i = clamp(i, 0, g.col_count() - 1)
		return row.find('.cell:nth-child('+(i+1)+')')
	}
	g.hcells = function() { return g.grid.find('.field'); }
	g.hcell = function(ci) { return g.grid.find('.field:nth-child('+(ci+1)+')'); }
	g.rowof = function(cell) { return cell.parent(); }
	g.vcells = function(ci) {
		return g.grid.find('.field:nth-child('+(ci+1)+'),.cell:nth-child('+(ci+1)+')')
	}

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
		g.grid.removeClass('active')
		active_grid = null
		return true
	}

	g.activate = function() {
		if (g.active()) return true
		if (active_grid && !active_grid.deactivate())
			return
		g.grid.addClass('active')
		active_grid = g
		return true
	}

	// row selection ----------------------------------------------------------

	g.selected_rows = function() { g.grid.find('.row.selected'); }
	g.deselect_rows = function(rows) { rows.removeClass('selected'); }
	g.select_rows = function(rows) { rows.addClass('selected'); }

	// row focusing -----------------------------------------------------------

	var active_row

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

	var active_cell

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
		if (caret == null)
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
		if (caret != null)
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
				// the row gets marked as changed anyway, because other cells
				// might still be in rejected state.
				g.rowof(cell).addClass('changed')
			}
		}
		cell.removeClass('edit')
		cell.find('.input_div').html('')
		active_input = null
		g.quick_edit = null
		return g.save_on_exit_edit ? g.save_values() : true
	}

	// make a new record with default values
	g.create_record = function() {
		var rec = []
		for (var fi in g.fields)
			rec.push(
				g.fields[fi].client_default ||
				g.fields[fi].server_default ||
				null)
		return rec
	}

	g.insert_row = function(ri) {

		// range-check or infer row index.
		if (ri == null)
			ri = g.active_row().index()
		ri = clamp(ri, 0, g.row_count())
		var append = ri == g.row_count()

		// make a new record with default values
		var rec = g.create_record()

		// add it to the values table
		g.values.splice(ri, 0, rec)

		// render it, add it to position, and get it
		var s = g.render_template('grid_rows', [rec])
		if (append)
			g.rows_ct().append(s)
		else
			g.row(ri).before(s)

		var row = g.row(ri)
		var cells = g.cells(row)

		// activate the row on the same cell as before
		g.activate_cell(g.cell(row, g.active_cell().index()))

		// mark the cells and the row as changed/new.
		g.cells().each(function(_, cell) {
			cell = $(cell)
			var field = g.field(cell.index())
			if (field.client_default != null)
				cell.addClass('changed')
		})
		cells.addClass('new')
		row.addClass('new changed')
	}

	var deleted = [] // [rec1, ...]

	g.delete_row = function(ri) {

		// range-check & set default row index
		if (ri == null)
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

	// ajax requests ----------------------------------------------------------

	g.sort_expr = function() {
		var s = ''
		for (var fi in g.fields) {
			var field = g.fields[fi]
			if (field.sort)
				s += field.name+':'+field.sort
		}
		return s
	}

	g.ajax_url = function() {
		if (!g.url_path) return
		var params = {}
		var sort = g.sort_expr()
		if (sort) params.sort = sort
		$.extend(params, g.url_params)
		return make_url(g.url_path, g.url_args, params)
	}

	g.ajax_success = function(data) {} // stub
	g.ajax_error = function(xhr) {} // stub

	// make a GET request (or a POST request if data is passed).
	g.ajax = function(data, success, error) {
		var url = g.ajax_url()
		if (!url) {
			if (success) success()
			return
		}
		var opt = {}
		opt.success = function(data) {
			g.ajax_success(data)
			if (success) success(data)
		}
		opt.error = function(xhr) {
			g.ajax_error(xhr)
			if (error) error(xhr)
		}
		if (data != null) {
			opt.type = 'POST'
			opt.data = {data: JSON.stringify(data)}
		}
		$.ajax(url, opt)
	}

	// saving / loading state -------------------------------------------------

	g.state = function() {
		//
	}

	g.update_state = function(state) {
		//
	}

	g.save_state = function() {
		//
	}

	// saving values ----------------------------------------------------------

	g.exit_row = function(row) {
		if (!g.exit_edit()) return
		return g.save_on_exit_row ? g.save_values() : true
	}

	g.changed_records = function() {
		var records = []
		g.changed_rows().each(function(_, row) {
			var values = {}
			g.changed_cells(row).each(function(_, cell) {
				var ci = $(cell).index()
				var val = g.val(cell)
				values[g.field(ci).name] = val
			})
			var id = g.row_id(row)
			records.push({id: id, values: values})
		})
		return records
	}

	g.save_values_success = function(data) {
		g.update_state(data)
		g.update_values(data.values)
	}

	g.save_values_error = function(xhr) {} // stub

	g.save_values = function() {
		var records = g.changed_records()
		if (!records.length) return true // nothing to save
		var state = g.state()
		g.ajax({
			records: records,
			state: state,
		}, g.save_values_success,
			g.save_values_error)
		return true
	}

	g.update_values = function(values) {
		for (var i in values) {
			var rec = values[i]
			var row = g.row_byid(rec[id_fi])
			g.cells(row).each(function(ci, cell) {
				cell = $(cell)
				var fi = g.fieldmap[ci]
				var serverval = rec[fi]
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
			// as "changed", the row itself will not be considered changed until
			// the user changes at least one cell again.
			row.removeClass('changed')
		}
	}

	// loading values ---------------------------------------------------------

	g.load_success = function(data) {

		// reset state
		if (g.active())
			active_grid = null
		active_row = $([])
		active_cell = $([])
		active_input = null

		g.update_state(data)

		if (data) {
			g.fields = data.fields
			g.values = data.values
		}
		g.render()

		g.activate_cell(g.cell(0, 0))
		if (g.immediate_mode)
			g.enter_edit(-1, true)

	}

	g.load_error = function(xhr) {} // stub

	g.load = function() {
		g.ajax(null, g.load_success, g.load_error)
	}

	// cell navigation --------------------------------------------------------

	g.near_cell = function(cell, rows, cols) {
		cell = cell || g.active_cell()
		rows = rows || 0
		cols = cols || 0

		if (!cell.length) return cell // no cells

		var ri = g.rowof(cell).index() + rows
		var ci = cell.index() + cols

		// end of the row trying to move to the right: move to next-row-first-cell.
		// beginning of the row trying to move to the left: move to prev-row-last-cell.
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

	// column re-ordering -----------------------------------------------------

	g.move_col = function(sci, dci) {
		if (sci === dci) return

		// update fieldmap
		var fi = g.fieldmap[sci]
		g.fieldmap.splice(sci, 1)
		g.fieldmap.splice(dci, 0, fi)

		// update DOM
		var scells = g.vcells(sci)
		var dcells = g.vcells(dci > sci && dci < g.col_count()-1 ? dci+1 : dci)
		if (dci == g.col_count()-1)
			$.each(dcells, function(i) {
				$(this).after(scells[i])
			})
		else
			$.each(dcells, function(i) {
				$(this).before(scells[i])
			})

		g.save_state()
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
			var selected = fully_selected(input)
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

	// mouse bindings ---------------------------------------------------------

	function make_clickable() {

		// activate the grid by clicking on the header
		g.grid.on('click', '.field', function() {
			g.activate()
		})

		// activate cell / enter edit by clicking on a cell
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

		// trigger sorting by clicking on the field box
		g.grid.on('click', '.field_box a', function() {
			if (!g.activate()) return

			var ci = $(this).closest('.field').index()
			var field = g.field(ci)

			// toggle sorting on this field
			field.sort = field.sort == 'asc' ? 'desc' :
				(field.sort == 'desc' ? null : 'asc')

			g.load()
		})

		// resize columns by dragging the resizer
		g.grid.find('.resizer')

			.drag(function(e, d) {

				g.activate() // resizing allowed even if activation failed

				var col = $(this).closest('.field')
				var ci = col.index()
				var field = g.field(ci)
				if (field.fixed_width) return // not movable

				// compute width
				var w = d.offsetX - col.position().left

				// update data
				field.width = w

				// update DOM
				col.width(w)
			})

			.drag('end', function() {
				g.save_state()
			})

		// move columns --------------------------------------------------------

		function check_drop(e) {
			var col = g.drag.dropcol
			if (!col) return
			var o = col.offset()
			var x = o.left
			var y = o.top
			var w = col.width()
			var bw =
				parseInt(col.css('border-left-width'))+
				parseInt(col.css('margin-left'))+
				parseInt(col.css('padding-left'))
			var ci = col.index()
			if (e.clientX > x + w / 2) {
				if (ci == g.col_count() - 1) // last col
					x = x + w + bw
				else
					x = g.hcell(ci + 1).offset().left
				ci++
			}
			g.drag.drop_ci = ci
			g.drag.move_sign.css({ left: x + bw, top: y, }).show()
		}

		g.grid.find('.field')

			.drag('start', function(e) {
				if (!g.activate()) return
				var ci = $(this).index()
				var field = g.field(ci)
				if (field.fixed_pos) return
				var col = $(this)
				g.vcells(ci).css('opacity', 0.5)
				col.prepend(
					'<div class=dragging_div>'+
						'<div class="field dragging" style="'+
							'width: '+col.width()+'px;'+
							'height: '+col.height()+'px;'+
							'left: '+e.startX+'px;'+
							'">'+col.html()+
						'</div>'+
					'</div>')
				var div = g.grid.find('.dragging_div')
				var move_sign = g.grid.find('.move_sign_div')
				g.drag = {ci: ci, col: col, div: div, move_sign: move_sign}
				return div
			}, {
				relative: true,
				distance: 10,
			})

			.drag(function(e, d) {
				if (!g.drag) return
				g.drag.div.css({ left: d.offsetX, })
				check_drop(e)
			}, { relative: true, })

			.drag('end', function() {
				if (!g.drag) return
				g.drag.div.remove()
				g.vcells(g.drag.ci).css('opacity', '')
				g.drag.move_sign.hide()

				var sci = g.drag.ci       // source col
				var dci = g.drag.drop_ci  // dest. col
				if (dci != null) {
					// compensate for removal of the source col
					if (dci > sci)
						dci--
					g.move_col(sci, dci)
				}

				g.drag = null
			})

			.drop('start', function(e) {
				if (!g.drag) return
				var col = $(this)
				g.drag.dropcol = col
				check_drop(e)
				col.addClass('dropping')
			})

			.drop('end', function() {
				if (!g.drag) return
				$(this).removeClass('dropping')
			})

	}

	// init and load ----------------------------------------------------------

	$.extend(g, g_opt)
	g.load()

	return g
}

action.grid = function() {

	listen('usr.grid.current_action', function() {
		allow(admin())
	})

	$('#layout').html('<div id=main></div><div id=d2></div>')

	var g = grid({
		container: '#main',
		url_path: '/dataset.json/ordr',
		immediate_mode: true,
	})

	var g = grid({
		//width: 700,
		container: '#d2',
		fields: [
			{name: 'id', readonly: true, width: 100, },
			{name: 'name', type: 'text', maxlength: 16, default: 'default name', width: 250, },
			{name: 'count', type: 'number', decimals: 2, width: 150, },
		],
		values: [[1, 'foo', 0], [2, 'bar', null]],
		fieldmap: [2, 0, 1],
	})

}

return grid
})()