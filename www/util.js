
// global strings and config values ------------------------------------------

// global S() for internationalizing strings.
var S_ = {}
function S(name, val) {
	if (val && !S_[name])
		S_[name] = val
	return S_[name]
}

// global C() for general config values.
var C_ = {}
function C(name, val) {
	if (val && !C_[name])
		C_[name] = val
	return C_[name]
}

// string formatting ---------------------------------------------------------

// usage:
//		'{1} of {0}'.format(total, current)
//		'{1} of {0}'.format([total, current])
//		'{current} of {total}'.format({'current': current, 'total': total})
String.prototype.format = function() {
	var s = this.toString()
	if (!arguments.length)
		return s
	var type1 = typeof arguments[0]
	var args = ((type1 == 'string' || type1 == 'number') ? arguments : arguments[0])
	for (arg in args)
		s = s.replace(RegExp('\\{' + arg + '\\}', 'gi'), args[arg])
	return s
}

// follow scroll -------------------------------------------------------------

function follow_scroll(element_id, margin) {
	var el = $(element_id)
	var ey = el.position().top + 46 // TODO: account for margins of parents!
	var adjust_position = function() {
		var y = $(this).scrollTop()
		if (y < ey - margin || window.innerHeight < el.height() + margin) {
			el.css({position: 'relative', top: ''})
		} else {
			el.css({position: 'fixed', top: margin})
		}
	}
	$(window).scroll(adjust_position)
	$(window).resize(adjust_position)
}

// global state --------------------------------------------------------------

function editmode() {
	return true
}

function check(truth) {
	if(!truth)
		window.location = '/'
}

// keyboard navigation -------------------------------------------------------

var keydown_events = {} // {id: handler}

function bind_keydown(id, func) {
	keydown_events[id] = func
}

function init_keydown() {
	$(document).keydown(function(event) {
		$.each(keydown_events, function(id, func) {
			func(event)
		})
	})
}

// history -------------------------------------------------------------------

function init_history() {
	var History = window.History
	History.Adapter.bind(window, 'statechange', function() {
		url_changed()
	})
}

function exec(url) {
	History.pushState(null, null, url)
}

var action = {} // {action: handler}
var default_action = 'cat'

function url_changed() {
	var args = location.pathname.split('/')
	args.shift() // remove /
	args.shift() // remove browse/
	var act = args[0] || default_action
	args.shift() // remove action/
	var handler = action[act]
	if (handler)
		handler.apply(null, args)
}

// persistence ---------------------------------------------------------------

function store(key, value) {
    Storage.setItem(key, JSON.stringify(value))
}

function getback(key) {
    var value = Storage.getItem(key)
    return value && JSON.parse(value)
}

// templating ----------------------------------------------------------------

function multi_column(template_id, items, col_count) {
	var s = '<table width=100%>'
	var template = $(template_id).html()
	var w = 100 / col_count
	$.each(items, function(i, item) {
		if (i % col_count == 0)
			s = s + '<tr>'
		s = s + '<td width='+w+'%>' + Mustache.render(template, item) + '</td>'
		if (i % col_count == col_count - 1 || i == items.length)
			s = s + '</tr>'
	})
	s = s + '</table>'
	return s
}

function apply_template(template_id, data, dest_id) {
	var template = $(template_id).html()
	var s = Mustache.render(template, data)
	if (dest_id) {
		$(dest_id).html(s)
	} else {
		return s
	}
}

// find an id attribute in the parents of an element
function upid(e, attr) {
	return parseInt($(e).closest('['+attr+']').attr(attr))
}

// code loading --------------------------------------------------------------

// load a js library asynchronously
function load_js(id, url) {
	var js, xjs = document.getElementsByTagName('script')[0]
	if (document.getElementById(id)) return
	js = document.createElement(s); js.id = id
	js.src = url
	xjs.parentNode.insertBefore(js, xjs)
}

// content loading -----------------------------------------------------------

// restartable ajax request.
var g_xhrs = {} //{dst_id: xhr}
function ajax(id, url, on_success, on_error, opt) {

	if (g_xhrs[id]) {
		g_xhrs[id].abort()
		delete g_xhrs[id]
	}

	g_xhrs[id] = $.ajax($.extend({
		url: url,
		success: function(data) {
			delete g_xhrs[id]
			if (on_success)
				on_success(data)
		},
		error: function(xhr) {
			delete g_xhrs[id]
			if (xhr.statusText == 'abort')
				return
			if (on_error)
				on_error(xhr)
		},
	}, opt))
}

function get(url, on_success, on_error) {
	ajax(url, url, on_success, on_error)
}

function post(url, data, on_success, on_error) {
	if (typeof data != 'string')
		data = {data: JSON.stringify(data)}
	ajax(url, url, on_success, on_error, {
		type: 'POST',
		data: data,
	})
}

// restartable ajax request with ui feedback.
function load_content(dst_id, url, on_success, on_error) {

	var sel = $(dst_id)
	var timeout = setTimeout(function() {
		sel.html('')
		sel.addClass('loading')
	}, C('loading_delay', 2000))

	var done = function() {
		clearTimeout(timeout)
		sel.removeClass('loading')
	}

	ajax(dst_id, url,
		function(data) {
			done()
			if (on_success)
				on_success(data)
		},
		function(xhr) {
			done()
			sel.html('<a><img src="/load_error.gif"></a>').find('a')
				.attr('title', xhr.responseText)
				.click(function() {
					sel.html('')
					sel.addClass('loading')
					load_content(dst_id, url, on_success, on_error)
				})
			if (on_error)
				on_error(xhr)
		}
	)
}

// ajax request on the main pane: redirect to homepage on 404.
function load_main(url, on_success, on_error) {
	load_content('#main', url, on_success, function(xhr) {
		check(xhr.status != 404)
	})
}
