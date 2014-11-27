

















// async operations with ui integration --------------------------------------

var async_function
var abort

(function() {

	var t = {} // {id: async_obj}

	abort = function(id) {
		if (!(id in t)) return
		t[id].abort()
		delete t[id]
	}

	async_function = function(cons) {

		return function(id, opt) {
			abort(id)
			var async_obj = {}

			function done() {
				delete t[id]
			}

			var obj = cons({
				abort: chain(done, opt.abort),
				success: chain(done, opt.success),
				error: chain(done, opt.error),
			})

			t[id] = async_obj
			return id
		}

	}

})()


var ajax = async_function(function(url, opt) {


})

var g_xhrs = {} //{id: xhr}

function abort(id) {
	if (!(id in g_xhrs)) return
	g_xhrs[id].abort()
	delete g_xhrs[id]
}

function ajax(url, opt) {
	opt = opt || {}
	var id = opt.id

	if (id)
		abort(id)

	var data = opt.data
	if (data && (typeof data != 'string'))
		data = {data: JSON.stringify(data)}
	var type = opt.type || (data ? 'POST' : 'GET')

	var xhr = $.ajax({
		url: url,
		success: function(data) {
			if (id)
				delete g_xhrs[id]
			if (opt.success)
				opt.success(data)
		},
		error: function(xhr) {
			if (id)
				delete g_xhrs[id]
			if (xhr.statusText == 'abort') {
				if (opt.abort)
					opt.abort(xhr)
			} else {
				if (opt.error)
					opt.error(xhr)
			}
		},
		type: type,
		data: data,
	})

	id = id || xhr
	g_xhrs[id] = xhr

	return id
}




// user interface integration for async operations: provides UI feedback for
// slow loading and failure, and the possibility to retry the operation.
// also, abort() calls on the same UI id clears the UI element.
function async_ui(ui, load, opt) {

	var ui = $(ui)
	var id = opt.id || $(ui).attr('id')
	abort(id)

	var stopwatch = setTimeout(function() {
		ui.html('')
		ui.addClass('loading')
	}, C('slow_loading_delay', opt.slow_loading_delay || 1000))

	var done = function() {
		clearTimeout(stopwatch)
		ui.removeClass('loading')
	}

	var ui = {
		load: load,
		success: done,
		error: function(xhr) {
			var err = typeof xhr == 'string' ? xhr : xhr.responseText
			done()
			ui.html('<a><img src="/load_error.gif"></a>').find('a')
				.attr('title', err)
				.click(function() {
					ui.html('')
					ui.addClass('loading')
					load()
				})
			if (error)
				error(xhr)
		},
		abort: done,
	}

	g_xhrs[id] = ui

	return ui
}

var ui
function load() {
	ajax('/login.json', {
		success: ui.success,
		error: ui.error,
		abort: ui.abort,
	})
}
ui = async_ui('#main', load)
load()
abort(



/*
function facebook_connect(success, error, opt) {

	var ui = async_ui(opt.ui)

	function success(usr) {
		ui.success()
		if (success) success(usr)
	}

	function error(err) {
		ui.error(err)
		if (error) error(err)
	}

	function abort(err) {
		ui.abort(err)
		if (opt && opt.abort) opt.abort(err)
	}

	function load() {
		FB.getLoginStatus(function(response) {
			if (response.status == 'connected')
				login({
					type: 'facebook',
					access_token: response.authResponse.accessToken,
				}, success, error, {abort: abort})
			else
				error(response.status)
		})
	}

	ui.load = load

	load()
}
*/


