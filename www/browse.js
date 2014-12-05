
// prods ---------------------------------------------------------------------

var g_prod_cols = 4

function format_prods(prods) {
	if (g_viewstyle == 'list') {
		return render('prod_list', prods)
	} else if (g_viewstyle == 'grid') {
		return render_multi_column('prod_grid_element', prods, g_prod_cols)
	}
}

var g_prods
function update_prods(prods) {

	prods = prods || g_prods

	$('#main').html(format_prods(prods))

	$('#main [pid] a').each(function() {
		setlink(this, '/p/'+upid(this, 'pid'))
	})

	$('#main .add_to_cart').click(function() {
		cart.add(upid(this, 'pid'))
	})

	g_prods = prods
}

function load_prods(catid, pagenum, bid) {
	load_main('/prods.json/'+catid+'/'+pagenum+'/'+(bid||'-')+'/'+g_pagesize,
		function(response) {
			update_pagenav(response.prod_count, pagenum, bid)
			update_prods(response.prods)
			select_brand(bid)
		})
}

// viewstyle -----------------------------------------------------------------

var g_viewstyle = 'grid'

function update_viewstyle_icons() {
	$('a[viewstyle] img').addClass('disabled')
	$('a[viewstyle="'+g_viewstyle+'"] img').removeClass('disabled')
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

var g_prod_rows = 16
var g_pagesize = g_prod_cols * g_prod_rows

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max)
}

function format_pagenav(prod_count, cur_page) {
	var s = ''
	if (cur_page > 1)
		s = s + '<a title="'+S('previous_page', 'previous page')+'">&laquo;</a> '
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
	if (cur_page < page_count)
		s = s + ' <a title="'+S('next_page', 'next page')+'">&raquo;</a>'
	return s
}

var g_scroll_to_top
function scroll_to_top() {
	if (!g_scroll_to_top) return
	g_scroll_to_top = false
	$('html, body').animate({ scrollTop: 0}, 1000, 'easeOutQuint')
}
function set_scroll_to_top() {
	g_scroll_to_top = true
}

function update_pagenav(prod_count, cur_page, bid) {
	scroll_to_top()

	$('.pagenav').html(format_pagenav(prod_count, cur_page))
	$('.pagenav a').each(function() {
		var s = $(this).html()
		var pagenum =
			(s == '«' && cur_page-1) ||
			(s == '»' && cur_page+1) ||
			parseInt(s)

		var bottom = $(this).closest('#bottom_navbar').length > 0

		setlink(this, cat_url(g_catid, pagenum, bid), null,
			bottom && set_scroll_to_top)
	})
	$('.navbar').show()

	// keyboard page navigation
	bind_keydown('page', function(event) {
		if (event.which == 39) {
			exec_cat(g_catid, cur_page + 1, bid)
		} else if (event.which == 37) {
			exec_cat(g_catid, cur_page - 1, bid)
		}
	})
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
function load_brands(catid, bid) { // used in cat.js
	if (g_brands_catid == catid)
		return
	load_content('#brands', '/brands.json/all/'+catid, function(data) {

		render('brands_list', data.brands, '#brands')

		if ($('#brands_list li').length > 40)
			$('#brand_search').show()
		else
			$('#brand_search').hide()
		$('#brand_search').quicksearch('#brands_list li').cache()

		$('#brands_list a[bid]').each(function() {
			var bid = parseInt($(this).attr('bid'))
			setlink(this, cat_url(catid, 1, bid))
		})

		select_brand(bid, true)

		g_brands_catid = catid
	})
}

// brands page ---------------------------------------------------------------

function select_brand_letter(search) {
	$('#letters a[search]').removeClass('active')
	if (search) {
		$('#letters a[search="'+search+'"]').addClass('active')
		select_topbar_cat()
	}
}

function update_brands_page(brands) {
	var s = render_multi_column('brands', brands, 4)
	$('#main').html('<br><br>'+s)

	$('#main a[bid]').each(function() {
		var bid = $(this).attr('bid')
		setlink(this, '/brand/'+bid)
	})
}

action.brands = function(search) {
	hide_nav()
	load_main('/brands.json/'+search, function(data) {
		update_brands_page(data.brands)
		select_brand_letter(search)
	})
}

function init_letters() {
	$('#letters a').each(function() {
		var search = $(this).attr('search')
		setlink(this, '/brands/'+search)
	})
}

// product page --------------------------------------------------------------

function change_prod_img(imgid) {
	if (!imgid) return

	$('#gallery a[imgid] > img').addClass('inactive').removeClass('active')
	$('#gallery a[imgid="'+imgid+'"] > img').addClass('active')
		.removeClass('inactive')

	var large_img = '/img/p/'+imgid+'-thickbox.jpg'

	$('#a_prod_img')
		.trigger('zoom.destroy')
		.css('display', 'inline-block')
		.removeClass('zoom_ou')
		.addClass('zoom_in')
		.attr('href', large_img)
		.on('click', function(e) { e.preventDefault(); })
		.html('<img id=prod_img>')
	$('#a_prod_img img').attr('src', '/img/p/'+imgid+'-large.jpg').load(function() {
		$('#a_prod_img').zoom({
			url: large_img, on: 'click',
			onZoomIn: function() {
				$('#a_prod_img').removeClass('zoom_in').addClass('zoom_out')
			},
			onZoomOut: function() {
				$('#a_prod_img').removeClass('zoom_out').addClass('zoom_in')
			},
		})
	})
}

var g_prod, g_combi

function dimsel_changed() {

	// compile values of selected dims into 'dvid1 dvid2 ...'
	var dvals = []
	$('#dimsel select[did] option:selected').each(function() {
		dvals.push(parseInt($(this).val()))
	})
	dvals.sort(function(a, b) { return a == b ? 0 : (a > b ? 1 : -1) })
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
		!combi.price && '<span class=notavailable>' +
			S('not_available', 'Not Available') + '</span>' ||
		(!combi.qty || combi.qty < 1) && '<span class=notavailable>' +
			S('out_of_stock', 'Out of stock') + '</span>' ||
		combi.qty > C('max_stock_reveal', 5) &&
			S('plenty_in_stock', '<b>Plenty in stock</b>') ||
		combi.qty < C('low_stock', 3) &&
			S('low_stock', '<b>Only {0} left</b> in stock').format(combi.qty) ||
		S('in_stock', '<b>{0} left</b> in stock').format(combi.qty)

	render('product_combi', co, '#combi')

	if (!combi.price || !combi.qty || combi.qty < 1) {
		$('#add_to_cart').prop('disabled', true).attr('title',
			S('not_available_msg',
				'Item not available.\nPlease choose another combination.'))
	} else {
		$('#add_to_cart').prop('disabled', false).attr('title', '')
	}

	var imgs = combi.imgs || []

	// if there are no images for this combi, use the cover image.
	if (!imgs.length)
		imgs.push(g_prod.imgid)

	render('product_gallery', imgs, '#gallery')

	change_prod_img(imgs[0])

	$('#gallery a[imgid]').click(function() {
		var imgid = $(this).attr('imgid')
		change_prod_img(imgid)
	})

}

function create_add_to_order_buttons() {

	if (!admin()) {
		$('#add_to_order').html('')
		return
	}

	load_content('#add_to_order', '/orderlist.json/open', function(data) {

		render('add_to_order', data, '#add_to_order')

		$('#add_to_order button').click(function() {
			var oid = $(this).attr('oid')
			orders.add(oid, g_combi.coid)
		})
	})
}

function update_product_page(prod) {
	g_prod = prod
	render('product_page', prod, '#main')

	$('#dimsel select[did]').change(dimsel_changed)
	dimsel_changed()

	setlink('.brandlink', '/brand/' + prod.bid)

	$('#add_to_cart').click(function() {
		cart.add(g_prod.pid, g_combi.coid)
	})

	// keyboard image navigation
	bind_keydown('gallery', function(event) {
		var img = $('#gallery a[imgid] > img.active')
		if (!img) return
		if (event.which == 39) {
			change_prod_img(img.closest('td').next('td').find('> a').attr('imgid'))
		} else if (event.which == 37) {
			change_prod_img(img.closest('td').prev('td').find('> a').attr('imgid'))
		}
	})

	// create "add to order" buttons now and whenever the user changes
	create_add_to_order_buttons()
	listen('usr.product_page.current_action', create_add_to_order_buttons)
}

action.p = function(pid) {
	hide_nav()
	load_main('/prod.json/'+pid, update_product_page)
}

// brand page ----------------------------------------------------------------

function update_brand_page(brand) {
	render('brand_page', brand, '#main')

	$('#bcat').html(format_cats(brand.cats))

	$('#bcat a').each(function() {
		var catid = $(this).parent().attr('catid')
		setlink(this, cat_url(catid, 1, brand.bid))
	})

	$('#bcat ul').show()
}

action.brand = function(bid) {
	hide_nav()
	load_main('/brand.json/'+bid, update_brand_page)
}

// top bar -------------------------------------------------------------------

function init_topbar() {
	var t = []

	t.push({catid:     27567}) // shoes
	t.push({catid:     27563}) // clothing
	t.push({catid:     27496}) // bags
	t.push({catid:     27495}) // acc.
	t.push({catid: 100000002}) // men
	t.push({catid: 200000002}) // women
	t.push({catid: 400000002}) // girls
	t.push({catid: 500000002}) // boys

	for (var i = 0; i < t.length; i++) {
		t[i].catname = g_cats[t[i].catid].name
	}
	render('topbar', {items: t}, '#topbar')

	$('#topbar a[catid]').each(function() {
		var catid = $(this).attr('catid')
		setlink(this, cat_url(catid))
	})
}

function select_topbar_cat(catid) {
	$('#topbar a[catid]').removeClass('active')
	if (catid)
		$('#topbar a[catid="'+catid+'"]').addClass('active')
}

// side bar ------------------------------------------------------------------

function init_sidebar() {
	follow_scroll('#sidebar', 20)
}

