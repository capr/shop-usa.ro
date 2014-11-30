function analytics_pageview() {} // stub

(function() {
	if (!C('xanalytics_ua', false)) return

	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','analytics');

	analytics('create', C('analytics_ua'), 'auto')

	analytics_pageview = function() {

		// we need to give it the url because it doesn't have it for some reason.
		var url = window.location.protocol +
			'//' + window.location.hostname +
			window.location.pathname +
			window.location.search

		analytics('send', 'pageview', {
			useBeacon: true,
			page: url,
		})
	}
})()

