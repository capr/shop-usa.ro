
// history -------------------------------------------------------------------

function init_history() {
	var History = window.History
	History.Adapter.bind(window, 'statechange', function() {
		url_changed()
	})
}

function push_link(url) {
	History.pushState(null, null, url)
}

var action = {} // {action: handler}
var default_action = 'browse'

function url_changed() {
	var args = location.pathname.split('/')
	var act = args[1] || default_action
	args.shift()
	args.shift()
	var handler = action[act]
	if (handler)
		handler.apply(null, args)
}


// mustache ------------------------------------------------------------------

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

// content loading -----------------------------------------------------------

var g_xhrs = {}

function load_content(sel_id, backend_url, on_success, on_error) {

	if (g_xhrs[sel_id]) {
		g_xhrs[sel_id].abort()
		delete g_xhrs[sel_id]
	}

	var sel = $(sel_id)
	sel.html('')
	sel.addClass('loading')

	g_xhrs[sel_id] = $.ajax({
		url: backend_url,
		success: function(data) {
			sel.removeClass('loading')
			delete g_xhrs[sel_id]
			if (on_success)
				on_success(data)
		},
		error: function(xhr) {
			sel.removeClass('loading')
			delete g_xhrs[sel_id]
			if (on_error) {
				on_error(xhr)
			} else {
				sel.addClass('loading_error')
			}
		},
	})
}

function load_main(user_url, backend_url, on_success, on_error) {
	push_link(user_url)
	load_content('#main', backend_url, function(data) {
		if (on_success) on_success(data)
	}, function(xhr) {
		if (on_error) on_error(xhr)
	})
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
	load_content('#cat', '/cat.json', function(cats) {
		update_cats(cats)
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

action.browse = function(catid, page_num) {
	var catid = parseInt(catid) || g_root_catid
	var page_num = parseInt(page_num) || 1
	change_cat(catid, page_num)
}

// prods ---------------------------------------------------------------------

var g_viewstyle = 'grid'
var g_col_count = 3
var g_prods

function format_prods(prods, viewstyle) {
	if (viewstyle == 'list') {
		return apply_template('#prod_list_template', prods)
	} else if (viewstyle == 'grid') {
		return multi_column('#prod_grid_element_template', prods, g_col_count)
	}
}

function update_prods(prods, viewstyle) {

	prods = prods || g_prods
	viewstyle = viewstyle || g_viewstyle

	$('#main').html(format_prods(prods, viewstyle))

	$('#main a').click(function() {
		var pid = parseInt($(this).parents('[pid]').first().attr('pid'))
		change_prod(pid)
	})

	$('#main .buybutton').click(function() {
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

	if (catid != g_catid)
		$('.topnav').hide()

	load_main(
		'/browse/'+catid+'/'+page_num,
		'/prod.json/'+catid+'/'+page_num,
		function(prods) {

			$('.topnav').show()

			update_pagenav(prod_count, page_num)
			update_prods(prods)

			g_catid = catid
			g_prod_count = prod_count
			g_page_num = page_num
		},
		function(xhr) {
			if (xhr.status == 404)
				change_cat(g_root_catid, 1)
		}
	)
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
	if (cur_page > 1) s = s + '<a>&laquo;</a> '
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
	if (cur_page < page_count) s = s + ' <a>&raquo;</a>'
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

function load_brands() {
	load_content('#brands', '/brands.json', function(brands) {
		apply_template('#brands_list_template', brands, '#brands')
		$('input#brand_search').quicksearch('ul#brands_list li').cache()
	})
}

function update_brands(brands) {
	var s = multi_column('#brands_template', brands, 4)
	$('#main').html('<br><br>'+s)
}

action.brands = function(search) {
	$('.topnav').hide()
	load_main(
		'/brands/'+search,
		'/brands.json/'+search,
		update_brands
	)
}

function init_letters() {
	$('#letters a').click(function() {
		var search = $(this).attr('search')
		action.brands(search)
	})
}

// load page -----------------------------------------------------------------

$(document).ready(function() {
	init_history()
	init_viewstyle()
	init_letters()
	load_cats()
	load_brands()
})

