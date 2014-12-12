var load_filters

(function() {

function update_filters(dims) {
	render('filters', dims, '#filters')
}

load_filters = function(catid, bid) {
	load_content('#filters', '/filters.json/'+catid+optarg(bid), update_filters)
}

})()
