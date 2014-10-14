<html>
<link rel="stylesheet" type="text/css" href="/main.css">
<script src="/jquery.js"></script>
<script src="/mustache.js"></script>
<script>

function format_node(node) {

	var id = node[0]
	var name = node[1]
	var prod_count = node[2]

	var s = '<ul catid=' + id + ' prod_count=' +
		prod_count + ' style="display: none;">' +
		'<a>' + name + '</a> <span class=gray>(' + prod_count + ')</span>'
	for (var i = 3; i < node.length; i++)
		s = s + '<li>' + format_node(node[i]) + '</li>'
	s = s + '</ul>'

	return s
}

function format_prods(prods) {
	var template = $('#prod_template').html()
	return Mustache.render(template, prods)
}

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max)
}

function format_pagenav(prod_count, cur_page, prod_per_page) {
	var s = ''
	if (cur_page > 1) s = s + '<a>«</a> '
	var page_count = Math.ceil(prod_count / prod_per_page)
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

var g_catid
var g_prod_count
var g_cur_page

function update_prods(prods, prod_count, cur_page) {
	$('#pagenav').html(format_pagenav(prod_count, cur_page, 100))
	$('#pagenav a').click(function() {
		var s = $(this).html()
		var page_num =
			(s == '«' && g_cur_page-1) ||
			(s == '»' && g_cur_page+1) ||
			parseInt(s)
		change_page(null, null, page_num)
	})
	$('#prod').html(format_prods(prods))
}

function update_cats(cats) {
	$('#cat').html(format_node(cats))

	$('#cat a').click(function() {
		if ($(this).hasClass('active'))
			return
		$('#cat ul').hide()
		$('#cat a').removeClass('active')
		$(this).parents('#cat ul').show()
		$(this).parent().children('li').find('>ul').show()
		$(this).addClass('active')

		var id = $(this).parent().attr('catid')
		var prod_count = $(this).parent().attr('prod_count')
		change_page(id, prod_count, 1)
	})
	$('#cat > ul').show()
}

var page_xhr
function change_page(catid, prod_count, page_num) {

	catid = catid || g_catid
	prod_count = prod_count || g_prod_count

	if (page_xhr)
		page_xhr.abort()

	if (catid != g_catid)
		$('#pagenav').html('')

	$('#prod').html('')
	$('#prod').addClass('loading')

	page_xhr = $.ajax('/prod.json/'+catid+'/'+page_num).done(function(prods) {
		$('#prod').removeClass('loading')
		update_prods(prods, prod_count, page_num)
		g_catid = catid
		g_prod_count = prod_count
		g_cur_page = page_num
	})
}

$(document).ready(function() {
	$('#cat').addClass('loading')
	$.ajax('/cat.json').done(function(cats) {
		update_cats(cats)
		$('#cat').removeClass('loading')
	})
})
</script>

<table cellpadding=10>
	<tr>
		<td valign=top width=300>
			<div id=cat></div>
		</td>
		<td valign=top>
			<div id=pagenav></div>
			<div id=prod></div>
		</td>
	</tr>
</table>

<script type="text/x-mustache" id=prod_template>
{{#.}}
	<p>
		<img src="/img/p/{{{imgid}}}-home.jpg" class=home_img>
		<br>
		<b>{{{bname}}}</b> {{{name}}}
		<br>
		<span class=price>${{price}}</span>
	</p>
{{/.}}
</script>

</html>
