<html>
<link rel="stylesheet" type="text/css" href="/main.css">
<script src="/jquery-1.11.1.js"></script>
<script src="/mustache.js"></script>
<script src="/jquery.history.js"></script>
<script src="/browse.js"></script>

<table cellpadding=10>
	<tr>
		<td valign=top width=300>
			<div id=cat></div>
			<br>
			<div id=brands></div>
		</td>
		<td valign=top width=900>
			<table width=100% id=letters>
				<tr>
					<?lua
					local letters = {'#'}
					for byte = string.byte'a', string.byte'z' do
						table.insert(letters, string.char(byte))
					end
					local w = 900 / #letters
					for i,letter in ipairs(letters) do
						local search = letter == '#' and '0-9' or letter
						local letter = letter:upper()
					?>
					<td align=center width=<?=w?>><a search=<?=search?>><?=letter?></a></td>
					<?lua
					end
					?>
				</tr>
			</table>
			<table width=100% class=topnav style="display: none;">
				<tr>
					<td class=small>
						<a viewstyle=grid>grid</a> |
						<a viewstyle=list>list</a>
					</td>
					<td align=right>
						<div class=pagenav></div>
					</td>
				</tr>
			</table>
			<div id=prod></div>
			<table width=100% class=topnav style="display: none;">
				<tr>
					<td align=right>
						<div class=pagenav></div>
					</td>
				</tr>
			</table>
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
	<div pid={{{pid}}}>
		<a><img src="/img/p/{{{imgid}}}-home.jpg" class=home_img></a>
		<br>
		<a><b>{{{bname}}}</b> {{{name}}}</a>
		<br>
		<span class=price>${{price}}</span>
		<br>
		<button type=button class=buybutton pid={{{pid}}}>add to bag</button>
	</div>
</script>

<script type="text/x-mustache" id=brands_list_template>
	<b>Brands</b>
	<ul>
	{{#.}}
		<li><a bid={{{bid}}}>{{bname}}</a></li>
	{{/.}}
	</ul>
</script>

<script type="text/x-mustache" id=brands_template>
	<span class=small><a bid={{{bid}}}>{{bname}}</a>
		<span class=gray>({{pcount}})</span></span>
</script>

</html>


