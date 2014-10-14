<html>
<link rel="stylesheet" type="text/css" href="/main.css">
<script src="/jquery.js"></script>
<script src="/mustache.js"></script>
<script src="/jquery.history.js"></script>
<script src="/browse.js"></script>

<table cellpadding=10>
	<tr>
		<td valign=top width=300>
			<div id=cat></div>
		</td>
		<td valign=top width=700>
			<table width=100% id=topnav style="display: none;">
				<tr>
					<td class=small>
						<a viewstyle=grid>grid</a> |
						<a viewstyle=list>list</a>
					</td>
					<td align=right>
						<div id=pagenav></div>
					</td>
				</tr>
			</table>
			<div id=prod></div>
		</td>
	</tr>
</table>

<script type="text/x-mustache" id=prod_list_template>
	<table width=100%>
		{{#.}}
		<tr pid={{{pid}}}>
			<td width=300>
				<img src="/img/p/{{{imgid}}}-home.jpg" class=home_img>
			</td>
			<td>
				<b>{{{bname}}}</b> {{{name}}}
				<br>
				<span class=price>${{price}}</span>
				<br>
				<button type=button class=buybutton>add to bag</button>
			</td>
		</tr>
		{{/.}}
	</table>
</script>

<script type="text/x-mustache" id=prod_grid_element_template>
	<td pid={{{pid}}}>
		<a><img src="/img/p/{{{imgid}}}-home.jpg" class=home_img></a>
		<br>
		<a><b>{{{bname}}}</b> {{{name}}}</a>
		<br>
		<span class=price>${{price}}</span>
		<br>
		<button type=button class=buybutton pid={{{pid}}}>add to bag</button>
	</td>
</script>

</html>
