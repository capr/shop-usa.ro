
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

// content loading -----------------------------------------------------------

var g_xhrs = {} //{sel_id: xhr}
function load_content(sel_id, backend_url, on_success, on_error) {

	if (g_xhrs[sel_id]) {
		g_xhrs[sel_id].abort()
		delete g_xhrs[sel_id]
	}

	var sel = $(sel_id)
	var timeout = setTimeout(function() {
		sel.html('')
		sel.addClass('loading')
	}, C('loading_delay', 2000))

	var done = function() {
		clearTimeout(timeout)
		sel.removeClass('loading')
		delete g_xhrs[sel_id]
	}

	g_xhrs[sel_id] = $.ajax({
		url: backend_url,
		success: function(data) {
			done()
			sel.removeClass('load_error')
			if (on_success)
				on_success(data)
		},
		error: function(xhr) {
			done()
			sel.addClass('load_error')
			if (on_error)
				on_error(xhr)
		},
	})
}

function load_main(backend_url, on_success, on_error) {
	load_content('#main', backend_url, on_success, function(xhr) {
		if (xhr.status == 404)
			window.location = '/'
	})
}

// cat tree ------------------------------------------------------------------

var g_root_catid = 2

function format_cats(node) {

	var id = node[0]
	var name = node[1]
	var prod_count = node[2]

	var s = '<ul catid=' + id + ' style="display: none;">' +
		'<a>' + name + '</a>'
	if (prod_count)
		s = s + ' <span class=gray>(' + prod_count + ')</span>'
	for (var i = 3; i < node.length; i++)
		s = s + '<li>' + format_cats(node[i]) + '</li>'
	s = s + '</ul>'

	return s
}

function update_cats(cats) {
	$('#cat').html(format_cats(cats))

	$('#cat a').click(function() {
		var catid = $(this).parent().attr('catid')
		exec('/browse/cat/'+catid)
	})
}

var g_cats
function load_cats(on_success) {
	if (g_cats) {
		$('#sidebar').show()
		on_success()
	} else {
		load_content('#cat', '/cat.json', function(cats) {
			g_cats = cats
			update_cats(cats)
			$('#sidebar').show()
			on_success()
		})
	}
}

function select_topbar_cat(catid) {
	$('#topbar a[catid]').removeClass('active')
	if (catid)
		$('#topbar a[catid="'+catid+'"]').addClass('active')
}

function select_tree_cat(catid, cid) {
	cid = cid || '#cat'
	$(cid+' ul').hide()
	$(cid+' a').removeClass('active')
	var cat_a = $(cid+' ul[catid="'+catid+'"] > a')
	cat_a.parents(cid+' ul').show()
	cat_a.parent().children('li').find('> ul').show()
	cat_a.addClass('active')
}

var g_catid
function select_cat(catid, cid) {
	if (catid != g_catid) {
		select_tree_cat(catid, cid)
		g_catid = catid
	}
	select_topbar_cat(catid)
	select_brand_letter()
}

action.cat = function(catid, page_num, bid) {

	catid = parseInt(catid) || g_root_catid
	page_num = parseInt(page_num) || 1
	bid = parseInt(bid) || ''

	load_cats(function() {
		select_cat(catid)
		load_prods(catid, page_num, bid)
		load_brands(catid, bid)
	})
}

// prods ---------------------------------------------------------------------

function format_prods(prods) {
	if (g_viewstyle == 'list') {
		return apply_template('#prod_list_template', prods)
	} else if (g_viewstyle == 'grid') {
		return multi_column('#prod_grid_element_template', prods, g_prod_cols)
	}
}

var g_prods
function update_prods(prods) {

	prods = prods || g_prods

	$('#main').html(format_prods(prods))

	$('#main [pid] a').click(function() {
		var pid = parseInt($(this).closest('[pid]').attr('pid'))
		exec('/browse/p/'+pid)
	})

	$('#main .buybutton').click(function() {
		var pid = parseInt($(this).parents('[pid]').first().attr('pid'))
		add_to_cart(pid)
	})

	g_prods = prods
}

function load_prods(catid, page_num, bid) {
	load_main('/prods.json/'+catid+'/'+page_num+'/'+(bid||'-')+'/'+g_pagesize,
	function(response) {
		update_pagenav(response.prod_count, page_num, bid)
		update_prods(response.prods)
		select_brand(bid)
	})
}

// viewstyle -----------------------------------------------------------------

var g_viewstyle = 'grid'

function update_viewstyle_icons() {
	$('a[viewstyle] img').addClass('disabled').removeClass('enabled')
	$('a[viewstyle="'+g_viewstyle+'"] img').addClass('enabled').removeClass('disabled')
}

function init_viewstyle() {
	$('a[viewstyle]').click(function() {
		g_viewstyle = $(this).attr('viewstyle')
		update_prods()
		update_viewstyle_icons()
	})
	update_viewstyle_icons()
}

// page nav ------------------------------------------------------------------

var g_prod_cols = 4
var g_prod_rows = 16
var g_pagesize = g_prod_cols * g_prod_rows

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max)
}

function format_pagenav(prod_count, cur_page) {
	var s = ''
	if (cur_page > 1) s = s + '<a>&laquo;</a> '
	var page_count = Math.ceil(prod_count / g_pagesize)
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

function update_pagenav(prod_count, cur_page, bid) {
	$('.pagenav').html(format_pagenav(prod_count, cur_page))
	$('.pagenav a').click(function() {
		var s = $(this).html()
		var page_num =
			(s == '«' && cur_page-1) ||
			(s == '»' && cur_page+1) ||
			parseInt(s)
		exec('/browse/cat/'+g_catid+
			((page_num > 1 || bid) ? '/'+page_num : '')+
			(bid && '/'+bid || ''))
	})
	$('.navbar').show()
}

// brands list ---------------------------------------------------------------

function select_brand(bid, scroll) {
	$('#brands_list a[bid]').removeClass('active')
	if (bid) {
		var e = $('#brands_list a[bid="'+bid+'"]').addClass('active')
		if (scroll)
			e[0].scrollIntoView()
	}
}

var g_brands_catid
function load_brands(catid, bid) {
	if (g_brands_catid != catid) {
		load_content('#brands', '/brands.json/all/'+catid, function(brands) {

			apply_template('#brands_list_template', brands, '#brands')

			if ($('#brands_list li').length > 40)
				$('#brand_search').show()
			else
				$('#brand_search').hide()
			$('#brand_search').quicksearch('#brands_list li').cache()

			$('#brands_list a[bid]').click(function() {
				var bid = parseInt($(this).attr('bid'))
				exec('/browse/cat/'+g_brands_catid+'/1/'+bid)
			})

			select_brand(bid, true)

			g_brands_catid = catid
		})
	}
}

// brands page ---------------------------------------------------------------

function select_brand_letter(search) {
	$('#letters a[search]').removeClass('active')
	if (search) {
		$('#letters a[search="'+search+'"]').addClass('active')
		select_topbar_cat()
	}
}

function update_brands(brands) {
	$('.navbar').hide()
	$('#sidebar').hide()
	var s = multi_column('#brands_template', brands, 4)
	$('#main').html('<br><br>'+s)

	$('#main a[bid]').click(function() {
		var bid = $(this).attr('bid')
		exec('/browse/brand/'+bid)
	})
}

action.brands = function(search) {
	load_main('/brands.json/'+search, function(brands) {
		update_brands(brands)
		select_brand_letter(search)
	})
}

function init_letters() {
	$('#letters a').click(function() {
		var search = $(this).attr('search')
		exec('/browse/brands/'+search)
	})
}

// product page --------------------------------------------------------------

function init_prod() {

	// keyboard image navigation
	$(document).keydown(function(event) {
		var img = $('#gallery a[imgid] > img.active')
		if (!img) return
		if (event.which == 39) {
			change_prod_img(img.closest('td').next('td').find('> a').attr('imgid'))
		} else if (event.which == 37) {
			change_prod_img(img.closest('td').prev('td').find('> a').attr('imgid'))
		}
	})
}

function change_prod_img(imgid) {
	if (!imgid) return

	$('#gallery a[imgid] > img').addClass('inactive').removeClass('active')
	$('#gallery a[imgid="'+imgid+'"] > img').addClass('active')
		.removeClass('inactive')

	$('#prod_img').attr('src', '/img/p/'+imgid+'-large.jpg').load(function() {})

	$('#zoom').removeData('jqzoom')
	$('#prod_img').attr('src', '/img/p/'+imgid+'-large.jpg').load(function() {
		$('#zoom').attr('href', '/img/p/'+imgid+'-thickbox.jpg')
		$('#zoom').jqzoom({zoomType: 'innerzoom', title: false, lens: false})
	})
}

var g_prod, g_combi

function dimsel_changed() {

	// compile values of selected dims into 'dvid1 dvid2 ...'
	var dvals = []
	$('#dimsel select[did] option:selected').each(function() {
		dvals.push(parseInt($(this).val()))
	})
	dvals.sort(function(a, b) { return a > b })
	dvals = dvals.join(' ')

	//find the combi for those dvals
	g_combi = g_prod.combis[dvals]
	var combi = g_combi || {}

	// prepare and apply the combi templates
	var co = {}
	co.price = combi.price &&
		S('price', '${0}').format(combi.price) ||
		S('na', '<span class=notavailable>N/A</span>')
	co.stock =
		!combi.price && '<span class=notavailable>' + S('not_available', 'Not Available') + '</span>' ||
		(!combi.qty || combi.qty < 1) && '<span class=notavailable>' + S('out_of_stock', 'Out of stock') + '</span>' ||
		combi.qty > C('max_stock_reveal', 5) && S('plenty_in_stock', '<b>Plenty in stock</b>') ||
		combi.qty < C('low_stock', 3) && S('low_stock', '<b>Only {0} left</b> in stock').format(combi.qty) ||
		S('in_stock', '<b>{0} left</b> in stock').format(combi.qty)

	apply_template('#product_combi_template', co, '#combi')

	if (!combi.price || !combi.qty || combi.qty < 1) {
		$('.buybutton').prop('disabled', true).addClass('disabled')
			.attr('title', S('not_available_msg', 'Item not available.\nPlease choose another combination.'))
	} else {
		$('.buybutton').prop('disabled', false).removeClass('disabled').attr('title', '')
	}

	var imgs = combi.imgs || []

	// if there are no images for this combi, use the cover image.
	if (!imgs.length)
		imgs.push(g_prod.imgid)

	apply_template('#product_gallery_template', imgs, '#gallery')

	change_prod_img(imgs[0])

	$('#gallery a[imgid]').click(function() {
		var imgid = $(this).attr('imgid')
		change_prod_img(imgid)
	})

}

function update_prod(prod) {

	g_prod = prod

	window.scrollTo(0, 0)

	$('.navbar').hide()
	$('#sidebar').hide()

	apply_template('#product_page_template', prod, '#main')

	$('#dimsel select[did]').change(dimsel_changed)

	dimsel_changed()

	$('#main .buybutton').click(function() {
		var pid = parseInt($(this).attr('pid'))
		add_to_cart(pid, g_combi.coid)
	})
}

action.p = function(pid) {
	load_main('/prod.json/'+pid, update_prod)
}

// cart ----------------------------------------------------------------------

var g_cart
function get_cart() {
	g_cart = g_cart || JSON.parse($.cookie('cart') || '[]')
	return g_cart
}

function set_cart() {
	$.cookie('cart', JSON.stringify(g_cart), {path: '/'})
}

function cart_item_index(pid, coid) {
	var key = pid+' '+coid
	var cart = get_cart()
	for (var i = 0; i < cart.length; i++) {
		if (cart[i].k == key)
			return i
	}
	cart.push({k: key, n: 0})
	return cart.length-1
}

function cart_item_count() {
	var cart = get_cart()
	var n = 0
	for (var i = 0; i < cart.length; i++) {
		n = n + cart[i].n
	}
	return n
}

function add_prod_to_cart(pid, coid) {
	var cart = get_cart()
	var i = cart_item_index(pid, coid)
	cart[i].n = cart[i].n + 1
	set_cart()
	return cart
}

function drag_prod_img_to_cart(finish) {
	var img = $('#prod_img').clone()
		.attr('id', '')
		.css({position: 'absolute'})
		.appendTo($('#fly_img_div'))
	var srp_abs = img.parent().offset()
	var dst_abs = $('#cart_icon').offset()
	img.animate({
		top: dst_abs.top - srp_abs.top,
		left: dst_abs.left - srp_abs.left,
		width: $('#cart_icon').width(),
		height: $('#cart_icon').height(),
		opacity: 0,
	}, 500, function() {
		img.remove()
		finish()
	})
}

function set_cart_icon() {
	var n = cart_item_count()
	$('#cart_icon').attr('src', n > 0 && '/bag_full.png' || '/bag.png')
	$('#cart_item_count').html((n < 10 ? '0' : '') + n)
	$('#cart_icon').click(function() {
		exec('/browse/cart')
	})
}

var g_ci_top
function update_cart_icon() {
	var ci = $('#cart_icon_div')
	g_ci_top = g_ci_top || ci.position().top - ci.offset().top
	ci.animate({top: g_ci_top - 20}, 100, 'easeOutExpo', function() {
		set_cart_icon()
		ci.animate({top: g_ci_top}, 500, 'easeOutBounce', function() {
			ci.css('top', '')
		})
	})
}

function add_to_cart(pid, coid) {
	drag_prod_img_to_cart(function() {
		add_prod_to_cart(pid, coid)
		update_cart_icon()
	})
}


function init_cart() {
	set_cart_icon(get_cart())
}

function update_cart_page(cart) {
	apply_template('#cart_page_template', cart, '#main')
}

action.cart = function(action) {
	if (!action) {
		load_main('/cart.json', update_cart_page)
	}
}

// brand page ----------------------------------------------------------------

function update_brand_page(brand) {
	$('#sidebar').hide()
	$('.navbar').hide()

	apply_template('#brand_page_template', brand, '#main')

	$('#bcat').html(format_cats(brand.cats))

	$('#bcat a').click(function() {
		var catid = $(this).parent().attr('catid')
		exec('/browse/cat/'+catid+'/1/'+brand.bid)
	})

	$('#bcat ul').show()
}

action.brand = function(bid) {
	load_main('/brand.json/'+bid, update_brand_page)
}

// top bar -------------------------------------------------------------------

function init_topbar() {
	var t = []
	t.push({catid: 27567, catname: 'Shoes'})
	t.push({catid: 27563, catname: 'Clothing'})
	t.push({catid: 27496, catname: 'Bags'})
	t.push({catid: 27495, catname: 'Accessories'})
	t.push({catid: 100000002, catname: 'Men\'s'})
	t.push({catid: 200000002, catname: 'Women\'s'})
	t.push({catid: 400000002, catname: 'Girls'})
	t.push({catid: 500000002, catname: 'Boys'})
	var w = 100 / t.length
	var data = {items: t, width: w}
	apply_template('#topbar_template', data, '#topbar')
	$('#topbar a[catid]').click(function() {
		var catid = $(this).attr('catid')
		exec('/browse/cat/'+catid)
	})
}

// side bar ------------------------------------------------------------------

function init_sidebar() {
	var el = $('#sidebar')
	var elpos = el.offset().top
	var headspace = 20
	var adjust_sidebar = function() {
		var y = $(this).scrollTop()
		if (y < elpos - headspace || window.innerHeight < el.height() + headspace) {
			el.css('position', 'static')
		} else {
			el.css({position: 'fixed', top: headspace})
		}
	}
	$(window).scroll(adjust_sidebar)
	$(window).resize(adjust_sidebar)
}

// load page -----------------------------------------------------------------

$(document).ready(function() {
	init_history()
	init_viewstyle()
	init_letters()
	init_sidebar()
	init_topbar()
	init_prod()
	init_cart()
	url_changed()
})


