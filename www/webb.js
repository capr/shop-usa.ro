
// glue ----------------------------------------------------------------------

function memoize(f) {
	var cache = {}
	return function(arg) {
		if (arg in cache)
			return cache[arg]
		return cache[arg] = f(arg)
	}
}

// return a function that calls a bunch of functions in order
// with the same args as passed to that function.
function chain() {
	var funcs = Array.prototype.slice.call(arguments)
	return function() {
		for (var i = 0; i < funcs.length; i++)
			funcs[i].apply(null, arguments)
	}
}

// $.extend() without overriding.
function merge(dst) {
	for (var i = 1; i < arguments.length; i++) {
		var src = arguments[i]
		for (var k in src)
			if (!dst.hasOwnProperty(k))
				dst[k] = src[k]
	}
}

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

// global lang() for conditionally setting S() values based on language.
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

// 'firstname lastname' -> 'firstname'; 'email@domain' -> 'email'
function firstname(name, email) {
	if (name) {
		name = name.trim()
		var a = name.split(' ', 1)
		return a.length > 0 ? a[0] : name
	} else if (email) {
		email = email.trim()
		var a = email.split('@', 1)
		return a.length > 0 ? a[0] : email
	} else {
		return ''
	}
}

function timeago(time) {
	var s = (Date.now() / 1000) - time
	if (s > 2 * 365 * 24 * 3600)
		return S('years_ago', '{0} years ago').format((s / (365 * 24 * 3600)).toFixed(0))
	else if (s > 2 * 30.5 * 24 * 3600)
		return S('months_ago', '{0} months ago').format((s / (30.5 * 24 * 3600)).toFixed(0))
	else if (s > 1.5 * 24 * 3600)
		return S('days_ago', '{0} days ago').format((s / (24 * 3600)).toFixed(0))
	else if (s > 2 * 3600)
		return S('hours_ago', '{0} hours ago').format((s / 3600).toFixed(0))
	else if (s > 2 * 60)
		return S('minutes_ago', '{0} minutes ago').format((s / 60).toFixed(0))
	else
		return S('one_minute_ago', '1 minute ago')
}

var short_months =
	['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
var months =
	['January','February','Mars','April','May','June','July','August','September','October','November','December']

function zeroes(n, d) {
	return Array(Math.max(d - String(n).length + 1, 0)).join(0) + n
}

function parse_date(s) {
	var a = s.split(/[^0-9]/)
	return new Date (a[0], a[1]-1, a[2], a[3], a[4], a[5])
}

function format_time(d) {
	return zeroes(d.getHours(), 2) + ':' + zeroes(d.getMinutes(), 2)
}

function is_today(d) {
	var now = new Date()
	return
		d.getDate() == now.getDate() &&
		d.getMonth() == now.getMonth() &&
		d.getFullYear() == now.getFullYear()
}

function format_date(date, months, showtime) {
	var d = parse_date(date)
	if (is_today(d)) {
		return S('today', 'Today') + (showtime ? format_time(d) : '')
	} else {
		var now = new Date()
		var day = d.getDate()
		var month = S(months[d.getMonth()].toLowerCase(), months[d.getMonth()])
		var year = (d.getFullYear() != now.getFullYear() ? d.getFullYear() : '')
		return S('date_format', '{year} {month} {day} {time}').format({
			day: day,
			month: month,
			year: year,
			time: (showtime == 'always' ? format_time(d) : '')
		})
	}
}

function shortdate(date, showtime) {
	return format_date(date, short_months, showtime)
}

function longdate(date, showtime) {
	return format_date(date, months, showtime)
}

function from_date(d) {
	return (d.match(/Azi/) ? 'de' : S('from', 'from')) + ' ' + d
}

var update_timeago
(function() {
	function update_timeago_elem() {
		var time = parseInt($(this).attr('time'))
		if (!time) {
			// set client-relative time from timeago attribute
			var time_ago = parseInt($(this).attr('timeago'))
			if (!time_ago) return
			time = (Date.now() / 1000) - time_ago
			$(this).attr('time', time)
		}
		$(this).html(timeago(time))
	}
	update_timeago = function() {
		$('.timeago').each(update_timeago_elem)
	}
	setInterval(update_timeago, 60 * 1000)
})()

// pub/sub -------------------------------------------------------------------

var g_events = $({})

function listen(topic, func) {
	g_events.on(topic, function(e, data) {
		func(data)
	})
}

function unlisten(topic) {
	g_events.off(topic)
}

function unlisten_all() {
	g_events.off('.current_action')
}

// broadcast a message to local listeners
function broadcast_local(topic, data) {
	g_events.triggerHandler(topic, data)
}

window.addEventListener('storage', function(e) {
	// decode the message
	if (e.key != 'broadcast') return
	var args = e.newValue
	if (!args) return
	args = JSON.parse(args)
	// broadcast it
	broadcast_local(args.topic, args.data)
})

// broadcast a message to other windows
function broadcast_external(topic, data) {
	if (typeof(Storage) == 'undefined') return
	localStorage.setItem('broadcast', '')
	localStorage.setItem('broadcast',
		JSON.stringify({
			topic: topic,
			data: data
		})
	)
	localStorage.setItem('broadcast', '')
}

function broadcast(topic, data) {
	broadcast_local(topic, data)
	broadcast_external(topic, data)
}

// UI patterns ---------------------------------------------------------------

// TODO: not working on OSX
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

// find an id attribute in the parents of an element
function upid(e, attr) {
	return parseInt($(e).closest('['+attr+']').attr(attr))
}

function notify(msg, cls) {
	$().toasty({
		message: msg,
		position: 'tc',
		autoHide: 1 / (100 * 5 / 60) * 1000 * msg.length, // assume 100 WPM
		messageClass: cls,
	})
}

// keyboard navigation -------------------------------------------------------

var keydown_events = {} // {id: handler}

function bind_keydown(id, func) {
	keydown_events[id] = func
}

function unbind_keydown_all() {
	keydown_events = {}
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

function full_url(url, params) {
	// encode params and add lang param to url if needed.
	var lang_ = lang()
	var explicit_lang = lang_ != C('default_lang', 'en')
	if (params || explicit_lang) {
		if (explicit_lang)
			params = $.extend({}, params, {lang: lang_})
		url = url + '?' + $.param(params)
	}
	return url
}

function exec(url, params) {
	// store current scroll top in current state first
	var top = $(window).scrollTop()
	var state = History.getState()
	History.replaceState({top: top}, state.title, state.url)
	// push new state without data
	History.pushState(null, null, full_url(url, params))
}

var action = {} // {action: handler}
var default_action = 'cat'

var g_action
var g_args

function url_changed() {
	unlisten_all()
	unbind_keydown_all()

	analytics_pageview() // note: title is not available at this time

	var args = location.pathname.split('/')
	args.shift() // remove /
	var act = args[0] || default_action
	args.shift() // remove action/
	var handler = action[act]
	check(handler)

	g_action = action
	g_args = args

	handler.apply(null, args)
}

/*
$(function() {
	$(window).scroll(function() {

	})
})
*/

function setscroll() {
	// set scroll back to where it was
	var state = History.getState()
	var top = state.data && state.data.top || 0
	$(window).scrollTop(top)
}

function scroll_top() {
	var state = History.getState()
	History.replaceState({top: 0}, state.title, state.url)
	$(window).scrollTop(0)
}

function setlink(a, url, params, hook) {
	$(a).attr('href', full_url(url, params))
		.click(function(event) {
			event.preventDefault()
			if (hook) hook()
			exec(url, params)
		})
}

function setlinks() {
	$('a').each(function() {
		var href = $(this).attr('href')
		if (href) {
			//
		}
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

// 1. optionally restartable and abortable on an id.
// 2. triggers an optional abort() event.
// 3. presence of data defaults to POST method.
// 4. non-string data turns json.

var g_xhrs = {} //{id: xhr}

function abort(id) {
	if (!(id in g_xhrs)) return
	g_xhrs[id].abort()
	delete g_xhrs[id]
}

function abort_all() {
	$.each(g_xhrs, function(id, xhr) {
		xhr.abort()
	})
	g_xhrs = {}
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

function get(url, success, error, opt) {
	return ajax(url,
		$.extend({
			success: success,
			error: error,
		}, opt))
}

function post(url, data, success, error, opt) {
	return ajax(url,
		$.extend({
			data: data,
			success: success,
			error: error,
		}, opt))
}

// ajax request with ui feedback for slow loading and failure.
// automatically aborts on load_content() and render() calls over the same dst.
function load_content(dst, url, success, error, opt) {

	var dst = $(dst)
	var slow_watch = setTimeout(function() {
		dst.html('')
		dst.addClass('loading')
	}, C('slow_loading_feedback_delay', 1500))

	var done = function() {
		clearTimeout(slow_watch)
		dst.removeClass('loading')
	}

	return ajax(url,
		$.extend({
			id: $(dst).attr('id'),
			success: function(data) {
				done()
				if (success)
					success(data)
			},
			error: function(xhr) {
				done()
				dst.html('<a><img src="/load_error.gif"></a>').find('a')
					.attr('title', xhr.responseText)
					.click(function() {
						dst.html('')
						dst.addClass('loading')
						load_content(dst, url, success, error)
					})
				if (error)
					error(xhr)
			},
			abort: done,
		}, opt))
}

// templating ----------------------------------------------------------------

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
		s = s + '<td width='+w+'% valign=top>' + render(item) + '</td>'
		if (i % col_count == col_count - 1 || i == items.length)
			s = s + '</tr>'
	})
	s = s + '</table>'
	return s
}

function render(template_name, data, dst) {
	var s = render_func(template_name)(data)
	if (dst) {
		var id = $(dst).attr('id')
		abort(id)
		$(dst).html(s)
	} else
		return s
}

function select_map(a, selv) {
	var t = []
	$.each(a, function(i, v) {
		var o = {value: v}
		if (selv == v)
			o.selected = 'selected'
		t.push(o)
	})
	return t
}
