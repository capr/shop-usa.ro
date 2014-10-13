<link rel="stylesheet" type="text/css" href="/main.css">
<script src="/jquery.js"></script>
<script src="/mustache.js"></script>
<script>

function format_node(node) {

	var id = node[0]
	var name = node[1]
	var count = node[2]

	var s = '<ul catid="' + id + '" style="display: none;">'
	s = s + '<a>' + name + '</a> (' + count + ')'
	for (var i = 3; i < node.length; i++)
		s = s + '<li>' + format_node(node[i]) + '</li>'
	s = s + '</ul>'

	return s
}

function format_prods(prods) {
	var s = ''
	var template = $('#prod_template').html()
	$.each(prods, function(i, prod) {
		s = s + Mustache.render(template, prod)
	})
	return s
}

function change_cat(catid) {
	$('#prod').html('loading...')
	$.ajax('/prod.json/'+catid).done(function(prods) {
		$('#prod').html(format_prods(prods))
	})
}

$(document).ready(function() {
	$.ajax('/cat.json').done(function(cats) {
		$('#cat').html(format_node(cats))

		$('#cat a').click(function() {

			$('#cat ul').hide()
			$('#cat a').removeClass('active')
			$(this).parents('#cat ul').show()
			$(this).parent().children('li').find('>ul').show()
			$(this).addClass('active')

			var id = $(this).parent().attr('catid')
			change_cat(id)

		})
		$('#cat > ul').show()
	})
})
</script>

<table cellpadding="10">
	<tr>
		<td valign="top">
			<div id="cat"></div>
		</td>
		<td valign="top">
			<div id="prod"></div>
		</td>
	</tr>
</table>

<script type="text/x-mustache" id="prod_template">
	<p>{{name}}</p>
</script>

