
var _gaq // must be global
function init_analytics() {
	var ua = C('analytics_ua')
	if (!ua) return

	_gaq = []
	_gaq.push(['_setAccount', ua])
	_gaq.push(['_trackPageview'])

	var loaded
	_gaq.push(function() {
		loaded = true
	})

	var ga = document.createElement('script')
	ga.type = 'text/javascript'
	ga.async = true
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'
	var s = document.getElementsByTagName('script')[0]
	s.parentNode.insertBefore(ga, s)

	// remove analytics if not loaring fast enough.
	setTimeout(function() {
		if (loaded) return
		ga.parentNode.removeChild(ga)
	}, 10000)
}

// note: we can't wait for the document to load to init this.
init_analytics()
