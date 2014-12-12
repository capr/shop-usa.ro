var load_filters

(function() {

load_filters = function(catid, bid) {
	load_content('#filters', '/filters.json/'+catid+optarg(bid), function(dims) {
		//
	})
}

})()
