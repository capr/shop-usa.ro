
// cat tree / formatting -----------------------------------------------------

var g_cats // {catid: cat}
function format_cat(cat) {

	g_cats[cat.id] = cat

	var s = '<ul catid=' + cat.id + ' style="display: none;">' +
		'<a>' +
			(cat.active && cat.name ||
				'<span class=gray>' + cat.name + '</span>') +
		'</a>'

	if (cat.count)
		s = s + ' <span class=gray>(' + cat.count + ')</span>'

	for (var i = 0; i < cat.cats.length; i++) {
		cat.cats[i].parent = cat
		s = s + '<li>' + format_cat(cat.cats[i]) + '</li>'
	}
	s = s + '</ul>'

	return s
}

function format_cats(home_cat) {
	g_cats = {}
	return format_cat(home_cat)
}

function update_cats(cats) {
	$('#cat').html(format_cats(cats))
	init_topbar()
}

// cat tree / loading --------------------------------------------------------

var g_cats_response
function load_cats(on_success) {
	$('#sidebar').show()
	if (g_cats) {
		on_success()
		return
	}
	if (g_cats_response) {
		update_cats(g_cats_response)
		g_cats_response = null
		on_success()
		return
	}
	load_content('#cat', '/cat.json', function(cats) {
		update_cats(cats)
		on_success()
	})
}

// cat tree / selecting ------------------------------------------------------

function cat_make_visible(catid) {
	$('#cat ul').hide()
	var ul = $('#cat ul[catid="'+catid+'"]')
	ul.parents('#cat ul[catid]').show()
	ul.show()
	ul.children('li').find('> ul').show()
}

function cat_make_active(catid) {
	$('#cat a.active').removeClass('active')
	$('#cat ul[catid="'+catid+'"] > a').addClass('active')
}

var g_catid
function select_sidebar_cat(catid) {

	if (catid == g_catid)
		return

	cat_make_visible(catid)
	cat_make_active(catid)
	cat_make_clickable(catid)
	cat_make_editable(catid)

	g_catid = catid
}

function select_cat(catid) {
	check(g_cats[catid])
	select_sidebar_cat(catid)
	select_topbar_cat(catid)
	select_brand_letter()
}

// cat tree / changing -------------------------------------------------------

function cat_make_clickable(catid) {
	$('#cat ul[catid] > a').off('click')
	$('#cat ul[catid]:visible > a').each(function() {
		var catid = $(this).parent().attr('catid')
		setlink(this, cat_url(catid))
	})
}

var g_home_catid = 2

action.cat = function(catid, pagenum, bid) {

	catid = parseInt(catid) || g_home_catid
	pagenum = parseInt(pagenum) || 1
	bid = parseInt(bid) || ''

	load_cats(function() {
		select_cat(catid)
		load_prods(catid, pagenum, bid)
		load_brands(catid, bid)
	})
}

function cat_url(catid, pagenum, bid) {

	catid = catid || g_home_catid
	pagenum = pagenum || 1

	return '/browse/cat'+
		((catid != g_home_catid || pagenum > 1 || bid) && '/'+catid || '')+
		((pagenum > 1 || bid) ? '/'+pagenum : '')+
		(bid && '/'+bid || '')
}

function exec_cat(catid, pagenum, bid) {
	exec(cat_url(catid, pagenum, bid))
}

function invalidate_cats() {
	g_cats = null
	g_catid = null
}

function reload_cats_with_response(cats) {
	g_cats_response = cats
	invalidate_cats()
	url_changed()
}

function reload_cats() {
	reload_cats_with_response()
}

// cat tree / editing --------------------------------------------------------

function cat_make_editable(catid) {

	$('#cat a.editable').removeClass('editable').next().remove()

	if (!editmode())
		return

	var cat_a = $('#cat ul[catid="'+catid+'"] > a')
	var cat = g_cats[catid]

	cat_a.addClass('editable').after(' \
		<span>\
		<a id=activate_cat class="fa fa-check-circle' +
			(cat.active ? '' : '-o') + '"></a>\
		<a id=add_cat      class="fa fa-plus-circle"></a>\
		<a id=rename_cat   class="fa fa-edit"></a>\
		<a id=remove_cat   class="fa fa-minus-circle"></a>\
		</span>\
	')

	$('#add_cat').click(function() {
		post('/cat.json/add', {catid: catid, name: 'Unnamed'},
			reload_cats_with_response, reload_cats)
	})

	$('#remove_cat').click(function() {

		if (!confirm(S('confirm_remove', 'Are you sure?')))
			return

		var parent_catid = g_cats[catid].parent.id

		var reload_cats_with_response = function(cats) {
			g_cats_response = cats
			invalidate_cats()
			exec_cat(parent_catid)
		}

		var reload_cats = function() {
			reload_cats_with_response()
		}

		post('/cat.json/remove', {catid: catid},
			reload_cats_with_response, reload_cats)
	})

	$('#rename_cat').click(function() {
		var name = prompt(S('ask_name', 'Enter the new name'), cat.name)
		if (name)
			post('/cat.json/rename', {catid: catid, name: name},
				reload_cats_with_response, reload_cats)
	})

	$('#activate_cat').click(function() {
		post('/cat.json/setactive', {
			catid: catid,
			active: Math.abs(1 - cat.active)
		}, reload_cats_with_response, reload_cats)
	})

	cat_make_draggable(catid)
}

function cat_make_draggable(catid) {

	$('#cat ul').sortable('destroy')

	$('#cat ul[catid="'+catid+'"]').sortable().bind('sortupdate', function() {

		var catids = []
		$(this).find('> li > ul').each(function() {
			catids.push(parseInt($(this).attr('catid')))
		})

		post('/cat.json/reorder', catids,
			reload_cats_with_response, reload_cats)
	})

	// sortable() makes draggable the non-li elements too...
	$('#cat a.active').closest('ul').find(':not(li)').attr('draggable', 'false')
}

