
// history -------------------------------------------------------------------

function init_history() {
	var History = window.History
	History.Adapter.bind(window, 'statechange', function() {
		var State = History.getState()
		url_changed(State.url)
	})
}

function push_link(url) {
	History.pushState(null, null, url)
}

// mustache ------------------------------------------------------------------

function multi_column(template_sel, items, col_count) {
	var s = '<table width=100%>'
	var template = template_sel.html()
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

// cat tree ------------------------------------------------------------------

var g_root_catid = 2

function format_cat(node) {

	var id = node[0]
	var name = node[1]
	var prod_count = node[2]

	var s = '<ul catid=' + id + ' prod_count=' +
		prod_count + ' style="display: none;">' +
		'<a>' + name + '</a> <span class=gray>(' + prod_count + ')</span>'
	for (var i = 3; i < node.length; i++)
		s = s + '<li>' + format_cat(node[i]) + '</li>'
	s = s + '</ul>'

	return s
}

function update_cats(cats) {
	$('#cat').html(format_cat(cats))

	$('#cat a').click(function() {
		if ($(this).hasClass('active'))
			return
		var catid = $(this).parent().attr('catid')
		change_cat(catid, 1)
	})
	$('#cat > ul').show()
}

function load_cats() {
	$('#cat').addClass('loading')
	$.ajax('/cat.json').done(function(cats) {
		update_cats(cats)
		$('#cat').removeClass('loading')
		url_changed()
	})
}

function change_cat(catid, page_num) {

	$('#cat ul').hide()
	$('#cat a').removeClass('active')
	var cat_a = $('#cat ul[catid="'+catid+'"] > a')
	cat_a.parents('#cat ul').show()
	cat_a.parent().children('li').find('>ul').show()
	cat_a.addClass('active')

	var prod_count = cat_a.parent().attr('prod_count')
	change_page(catid, prod_count, page_num)
}

// content -------------------------------------------------------------------

var g_xhr
function change_content(user_url, backend_url, on_done, on_error) {

	if (g_xhr)
		g_xhr.abort()

	push_link(user_url)

	$('#prod').html('')
	$('#prod').addClass('loading')

	g_xhr = $.ajax({

		url: backend_url,

		error: function(xhr) {
			if (on_error)
				on_error()
			//TODO: pop link
		},

	}).done(function(prods) {

		$('.topnav').show()
		$('#prod').removeClass('loading')

		on_done()
	})
}

// prods ---------------------------------------------------------------------

var g_viewstyle = 'grid'
var g_col_count = 3
var g_prods

function format_prods(prods, viewstyle) {
	if (viewstyle == 'list') {
		var template = $('#prod_list_template').html()
		return Mustache.render(template, prods)
	} else if (viewstyle == 'grid') {
		return multi_column($('#prod_grid_element_template'), prods, g_col_count)
	}
}

function update_prods(prods, viewstyle) {

	prods = prods || g_prods
	viewstyle = viewstyle || g_viewstyle

	$('#prod').html(format_prods(prods, viewstyle))

	$('#prod a').click(function() {
		var pid = parseInt($(this).parents('[pid]').first().attr('pid'))
		change_prod(pid)
	})

	$('#prod .buybutton').click(function() {
		var pid = parseInt($(this).parents('[pid]').first().attr('pid'))
		add_to_cart(pid)
	})

	g_viewstyle = viewstyle
	g_prods = prods
}

var g_catid
var g_prod_count
var g_page_num
function change_page(catid, prod_count, page_num) {

	catid = catid || g_catid
	prod_count = prod_count || g_prod_count
	page_num = page_num || g_page_num

	push_link('/browse/'+catid+'/'+page_num)

	if (catid != g_catid)
		$('.topnav').hide()

	$('#prod').html('')
	$('#prod').addClass('loading')

	g_xhr = $.ajax({

		url: '/prod.json/'+catid+'/'+page_num,

		error: function(xhr) {
			if (xhr.status == 404) {
				change_cat(g_root_catid, 1)
			}
		},

	}).done(function(prods) {

		$('.topnav').show()
		$('#prod').removeClass('loading')

		update_pagenav(prod_count, page_num)
		update_prods(prods)

		g_catid = catid
		g_prod_count = prod_count
		g_page_num = page_num
	})
}

// viewstyle -----------------------------------------------------------------

function change_viewstyle(viewstyle) {
	update_prods(null, viewstyle)
}

function init_viewstyle() {
	$('a[viewstyle]').click(function() {
		var viewstyle = $(this).attr('viewstyle')
		change_viewstyle(viewstyle)
	})
}

// page nav ------------------------------------------------------------------

var g_prod_per_page = 99

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max)
}

function format_pagenav(prod_count, cur_page) {
	var s = ''
	if (cur_page > 1) s = s + '<a>«</a> '
	var page_count = Math.ceil(prod_count / g_prod_per_page)
	cur_page = clamp(cur_page, 1, page_count)
	var dotted
	for (var i = 1; i <= page_count; i++) {
		if (
			i == 1 ||
			(i <= 4 && cur_page <= 4) ||
			(i >= cur_page-2 && i <= cur_page + 1) ||
			i == page_count
		) {
			s = s + '<a' + (i == cur_page ? ' class=active' : '') + '>' + i + '</a> '
			dotted = false
		} else {
			if (!dotted)
				s = s + ' ... '
			dotted = true
		}
	}
	if (cur_page < page_count) s = s + ' <a>»</a>'
	return s
}

function update_pagenav(prod_count, cur_page) {
	$('.pagenav').html(format_pagenav(prod_count, cur_page))
	$('.pagenav a').click(function() {
		if ($(this).hasClass('active'))
			return
		var s = $(this).html()
		var page_num =
			(s == '«' && cur_page-1) ||
			(s == '»' && cur_page+1) ||
			parseInt(s)
		change_page(null, null, page_num)
	})
}

function change_prod(pid) {
	console.log('change_prod', pid)
}

function add_to_cart(pid) {
	console.log('add_to_cart', pid)
}

// brands --------------------------------------------------------------------

function load_brands1() {
	$('#brands').addClass('loading')
	$.ajax('/brands.json').done(function(brands) {
		$('#brands').removeClass('loading')
		var template = $('#brands_list_template').html()
		var s = Mustache.render(template, brands)
		$('#brands').html(s)
	})
}

function load_brands(search) {
	$('.topnav').hide()
	$('#prod').addClass('loading')
	$.ajax('/brands.json/'+search).done(function(brands) {
		$('#prod').removeClass('loading')
		var s = multi_column($('#brands_template'), brands, 4)
		$('#prod').html(s)
	})
	push_link('/brands/'+search)
}

function init_letters() {
	$('#letters a').click(function() {
		var search = $(this).attr('search')
		load_brands(search)
	})
}

// load page -----------------------------------------------------------------

function url_changed() {
	var args = location.pathname.split('/')
	var action = args[1] || 'browse'
	if (action == 'browse') {
		var catid = parseInt(args[2]) || g_root_catid
		var page_num = parseInt(args[3]) || 1
		change_cat(catid, page_num)
	} else if (action == 'brands') {
		var letter = args[2]
		load_brands(letter)
	}
}

$(document).ready(function() {
	init_history()
	init_viewstyle()
	init_letters()
	load_cats()
	//load_brands()
})

