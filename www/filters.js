var load_filters

(function() {

function parse_fq(fq) {
	if (!fq)
		return []
	var t = fq.split(';')
	for (var i = 0; i < t.length; i++) {
		var v = t[i].split(',')
		for (var j = 0; j < v.length; j++)
			v[j] = parseInt(v[j])
		t[i] = v
	}
	return t
}

function update_filters(filters, bid, order, q, fq) {

	var fq = parse_fq(fq)

	// make a vid map so we can check which values are selected
	var vids = {}
	for (var i = 0; i < fq.length; i++) {
		var t = fq[i]
		for (var j = 0; j < t.length; j++) {
			var vid = t[j]
			vids[vid] = true
		}
	}

	// mark selected vids in filters
	// also, make a fidmap so we can track back fids from vids.
	var fidmap = {} // {vid: fid}
	for (var i = 0; i < filters.length; i++) {
		var filter = filters[i]
		var values = filter.values
		for (var j = 0; j < values.length; j++) {
			var v = values[j]
			v.selected = vids[v.vid]
			fidmap[v.vid] = filter.fid
		}
	}

	// build a modified fq
	function build_fq(fq, action, vid) {
		var fid = fidmap[vid]
		var t = []
		var changed
		console.log('build_fq', fq, action, vid, ';', fid)
		for (var i = 0; i < fq.length; i++) {
			var vids = fq[i]
			if (!changed) {
				var fid1 = fidmap[vids[0]]
				if (fid1 == fid) {
					if (action == 'add') {
						vids = vids.slice(0)
						vids.push(vid)
					} else if (action == 'remove') {
						vids = vids.slice(0)
						vids.splice(vids.indexOf(vid), 1)
					}
					changed = true
				}
			}
			t.push(vids.join(','))
		}
		if (!changed && action == 'add')
			t.push(vid)
		return t.join(';')
	}

	render('filters', filters, '#filters')

	$('#filters a[vid]').each(function() {
		var a = $(this)
		var vid = parseInt(a.attr('vid'))
		var action = a.hasClass('selected') ? 'remove' : 'add'
		var modified_fq = build_fq(fq, action, vid)
		setlink(this, cat_url(g_catid, 1, bid, order, q, modified_fq))
	})
}

load_filters = function(catid, bid, order, q, fq) {
	load_content('#filters', '/filters.json/'+catid+optarg(bid),
		function(filters) {
			update_filters(filters, bid, order, q, fq)
		})
}

})()
