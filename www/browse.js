
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

	$('#main [pid] a').each(function() {
		setlink(this, '/browse/p/'+upid(this, 'pid'))
	})

	$('#main .buybutton').click(function() {
		add_to_cart(upid(this, 'pid'))
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
	$('.pagenav a').each(function() {
		var s = $(this).html()
		var pagenum =
			(s == '«' && cur_page-1) ||
			(s == '»' && cur_page+1) ||
			parseInt(s)
		setlink(this, cat_url(g_catid, pagenum, bid))
	})
	$('.navbar').show()

	// keyboard page navigation
	bind_keydown('page', function(event) {
		if ($('#gallery a[imgid]').length) return // gallery uses left/right too
		if (event.which == 39) {
			exec_cat(g_catid, cur_page + 1, bid)
		} else if (event.which == 37) {
			exec_cat(g_catid, cur_page - 1, bid)
		}
	})
}

function init_pagenav() {

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
	load_content('#brands', '/brands.json/all/'+catid, function(brands) {

		apply_template('#brands_list_template', brands, '#brands')

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
	var s = multi_column('#brands_template', brands, 4)
	$('#main').html('<br><br>'+s)

	$('#main a[bid]').each(function() {
		var bid = $(this).attr('bid')
		setlink(this, '/browse/brand/'+bid)
	})
}

action.brands = function(search) {
	hide_nav()
	load_main('/brands.json/'+search, function(brands) {
		update_brands_page(brands)
		select_brand_letter(search)
	})
}

function init_letters() {
	$('#letters a').each(function() {
		var search = $(this).attr('search')
		setlink(this, '/browse/brands/'+search)
	})
}

// product page --------------------------------------------------------------

function init_prod() {

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
		!combi.price && '<span class=notavailable>' +
			S('not_available', 'Not Available') + '</span>' ||
		(!combi.qty || combi.qty < 1) && '<span class=notavailable>' +
			S('out_of_stock', 'Out of stock') + '</span>' ||
		combi.qty > C('max_stock_reveal', 5) &&
			S('plenty_in_stock', '<b>Plenty in stock</b>') ||
		combi.qty < C('low_stock', 3) &&
			S('low_stock', '<b>Only {0} left</b> in stock').format(combi.qty) ||
		S('in_stock', '<b>{0} left</b> in stock').format(combi.qty)

	apply_template('#product_combi_template', co, '#combi')

	if (!combi.price || !combi.qty || combi.qty < 1) {
		$('.buybutton').prop('disabled', true)
			.attr('title', S('not_available_msg',
				'Item not available.\nPlease choose another combination.'))
	} else {
		$('.buybutton').prop('disabled', false)
			.attr('title', '')
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

function update_product_page(prod) {
	g_prod = prod
	window.scrollTo(0, 0)

	apply_template('#product_page_template', prod, '#main')

	$('#dimsel select[did]').change(dimsel_changed)
	dimsel_changed()

	setlink('.brandlink', '/browse/brand/' + prod.bid)

	$('#main .buybutton').click(function() {
		var pid = parseInt($(this).attr('pid'))
		add_to_cart(pid, g_combi.coid)
	})
}

action.p = function(pid) {
	hide_nav()
	load_main('/prod.json/'+pid, update_product_page)
}

// brand page ----------------------------------------------------------------

function update_brand_page(brand) {
	apply_template('#brand_page_template', brand, '#main')

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

// password reset page ------------------------------------------------------

action.reset_password = function(token) {

	if (token) {

		function login_ok() {
			exec('/reset_password')
		}

		function login_failed() {
			//
		}

		post('/login.json', {type: 'token', token: token}, login_ok, login_failed)

	} else {

		//

	}
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
	apply_template('#topbar_template', {items: t}, '#topbar')

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

// load page -----------------------------------------------------------------

$(document).ready(function() {
	init_keydown()
	init_history()
	init_viewstyle()
	init_letters()
	init_sidebar()
	init_prod()
	init_pagenav()
	init_cart()
	init_facebook()
	init_google()
	url_changed()
})

