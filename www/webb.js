
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
	if (typeof(C_[name]) === 'undefined')
		console.log('warning: missing config value for ', name)
	return C_[name]
}

// global lang() for conditionally setting S() values based on language
function lang() {
	return document.documentElement.lang
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

if (typeof String.prototype.trim !== 'function') {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, '')
	}
}

// 'firstname lastname' -> 'firstname'
function firstname(name) {
	name = name.trim()
	var a = name.split(' ', 1)
	return a.length > 0 ? a[0] : name
}

// UI patterns ---------------------------------------------------------------

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

// keyboard navigation -------------------------------------------------------

var keydown_events = {} // {id: handler}

function bind_keydown(id, func) {
	keydown_events[id] = func
}

$(function() {
	$(document).keydown(function(event) {
		$.each(keydown_events, function(id, func) {
			func(event)
		})
	})
})

// address bar and links -----------------------------------------------------

function check(truth) {
	if(!truth)
		window.location = '/'
}

function allow(truth) {
	if(!truth)
		window.location = '/account'
}

$(function() {
	var History = window.History
	History.Adapter.bind(window, 'statechange', function() {
		url_changed()
	})
})

function exec(url) {
	History.pushState(null, null, url)
}

var action = {} // {action: handler}
var default_action = 'cat'

function url_changed() {
	analytics_pageview() // note: title is not available at this time
	var args = location.pathname.split('/')
	args.shift() // remove /
	var act = args[0] || default_action
	args.shift() // remove action/
	var handler = action[act]
	check(handler)
	handler.apply(null, args)
}

function setlink(a, url) {
	$(a).attr('href', url).click(function(event) {
		event.preventDefault()
		exec(url)
	})
}

// persistence ---------------------------------------------------------------

function store(key, value) {
	Storage.setItem(key, JSON.stringify(value))
}

function getback(key) {
	var value = Storage.getItem(key)
	return value && JSON.parse(value)
}

// ajax requests -------------------------------------------------------------

var g_xhrs = {} //{id: xhr}

function abort(id) {
	if (!g_xhrs[id]) return
	g_xhrs[id].abort()
	delete g_xhrs[id]
}

function ajax(id, url, on_success, on_error, on_abort, opt) {

	abort(id)

	g_xhrs[id] = $.ajax($.extend({
		url: url,
		success: function(data) {
			delete g_xhrs[id]
			if (on_success)
				on_success(data)
		},
		error: function(xhr) {
			delete g_xhrs[id]
			if (xhr.statusText == 'abort') {
				if (on_abort)
					on_abort(xhr)
			} else {
				allow(xhr.status != 403)
				if (on_error)
					on_error(xhr)
			}
		},
	}, opt))
}

function get(url, on_success, on_error) {
	ajax('get:'+url, url, on_success, on_error)
}

function post(url, data, on_success, on_error) {
	if (typeof data != 'string')
		data = {data: JSON.stringify(data)}
	ajax('post:'+url, url, on_success, on_error, null, {
		type: 'POST',
		data: data,
	})
}

// templating ----------------------------------------------------------------

function memoize(f) {
	var cache = {}
	return function(arg) {
		if (arg in cache)
			return cache[arg]
		return cache[arg] = f(arg)
	}
}

var render_func = memoize(function(name) {
	var template = $('#' + name + '_template').html()
	return function(data) {
		return Mustache.render(template, data || {})
	}
})

function render_multi_column(template_name, items, col_count) {
	var s = '<table width=100%>'
	var render = render_func(template_name)
	var w = 100 / col_count
	$.each(items, function(i, item) {
		if (i % col_count == 0)
			s = s + '<tr>'
		s = s + '<td width='+w+'%>' + render(item) + '</td>'
		if (i % col_count == col_count - 1 || i == items.length)
			s = s + '</tr>'
	})
	s = s + '</table>'
	return s
}

function render(template_name, data, dst) {
	var s = render_func(template_name)(data)
	if (dst) {
		abort($(dst).attr('id'))
		$(dst).html(s)
	} else
		return s
}

// find an id attribute in the parents of an element
function upid(e, attr) {
	return parseInt($(e).closest('['+attr+']').attr(attr))
}

// content loading -----------------------------------------------------------

// restartable ajax request with ui feedback.
function load_content(dst, url, on_success, on_error) {

	var dst = $(dst)
	var timeout = setTimeout(function() {
		dst.html('')
		dst.addClass('loading')
	}, C('loading_delay', 1000))

	var done = function() {
		clearTimeout(timeout)
		dst.removeClass('loading')
	}

	ajax($(dst).attr('id'), url,
		function(data) {
			done()
			if (on_success)
				on_success(data)
		},
		function(xhr) {
			done()
			dst.html('<a><img src="/load_error.gif"></a>').find('a')
				.attr('title', xhr.responseText)
				.click(function() {
					dst.html('')
					dst.addClass('loading')
					load_content(dst, url, on_success, on_error)
				})
			if (on_error)
				on_error(xhr)
		},
		function(xhr) {
			done()
		}
	)
}

// ajax request on the main pane: redirect to homepage on 404.
function load_main(url, on_success, on_error) {
	load_content('#main', url, on_success, function(xhr) {
		check(xhr.status != 404)
		if (on_error)
			on_error(xhr)
	})
}

function hide_nav() {
	$('.navbar').hide()
	$('#sidebar').hide()
}

