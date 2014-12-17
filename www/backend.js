(function() {

action.backend = function(report) {

	listen('usr.backend.current_action', function() {
		allow(admin())
	})

	$('#layout').html('<div id=main></div>')

	function clean_data(data) {
		for (var i = 0; i < data.rows.length; i++) {
			var row = data.rows[i].values
			for (var j = 0; j < row.length; j++) {
				if (row[j] === null)
					row[j] = 'null'
			}
		}
	}

	function update_backend(data) {
		clean_data(data)
		if (data.detail) {

			render('md_horiz', {
				master: render('report', data),
			}, '#main')

			$('tr [rowid]').click(function() {
				var id = $(this).attr('rowid')

				load_content('#detail', '/backend.json/'+data.detail+'/'+id,
					function(data) {
						clean_data(data)
						render('report', data, '#detail')
					})

			})

		} else
			render('report', data, '#main')
	}

	var args = Array.prototype.slice.call(arguments)
	load_main('/backend.json/'+args.join('/'), update_backend)

}

})()

