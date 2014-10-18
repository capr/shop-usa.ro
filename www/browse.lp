<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<link rel="stylesheet" type="text/css" href="/main.css">
	<script src="/jquery.js"></script>
	<script src="/mustache.js"></script>
	<script src="/util.js"></script>
	<script src="/jquery.history.js"></script>
	<script src="/jquery.cookie.js"></script>
	<script src="/jquery.quicksearch.js"></script>
	<script src="/jquery.jqzoom.js"></script>
	<script src="/jquery.easing.js"></script>
	<link rel="stylesheet" type="text/css" href="/jquery.jqzoom.css">
	<script src="/browse.js"></script>
</head>
<body>

<table cellpadding=10>
	<tr>
		<td valign=top width=280>
			<a href=/><img src="/logo.jpg"></a>
			<br>
			<br>
			<div id=sidebar>
				<div id=cat></div>
				<br>
				<div id=brands></div>
			</div>
		</td>
		<td valign=top width=900>
			<table width=100% id=letters>
				<tr valign=top height=40>
					<?lua
					local letters = {'#'}
					for byte = string.byte'A', string.byte'Z' do
						table.insert(letters, string.char(byte))
					end
					local w = 900 / #letters
					for i,letter in ipairs(letters) do
						local search = letter == '#' and 'other' or letter
					?>
					<td align=center width=<?=w?>><a search=<?=search?>><?=letter?></a></td>
					<?lua
					end
					?>
				</tr>
			</table>
			<table width=100%>
				<td align=right style="text-align: right;">
					<a>
						<div id=cart_icon_div style="position: relative;" align=right>
							<img id=cart_icon>
							<div style="float: right; position: relative; top: 11px; left: -21px;">
								<span id=cart_item_count></span>
							</div>
						</div>
					</a>
				</td>
			</table>
			<table width=100% class=navbar id=top_navbar style="display: none">
				<tr>
					<td>
						<table>
							<tr>
								<td><a viewstyle=grid><img src="/grid.png"></a></td>
								<td width=4></td>
								<td><a viewstyle=list><img src="/list.png"></a></td>
							</tr>
						</table>
					</td>
					<td align=right>
						<div class="pagenav small"></div>
					</td>
				</tr>
			</table>
			<div id=main></div>
			<table width=100% class=navbar id=bottom_navbar style="display: none">
				<tr>
					<td align=right>
						<div class=pagenav></div>
					</td>
				</tr>
			</table>
			<table width=100%>
				<tr height=140>
					<td align=center>
						<span class=gray>Made with
						<a href="http://luapower.com/" target=_blank>Lua Power</a>,
						Love, Spice, and
						<a href="http://openresty.org/" target=_blank>Everything Nice</a>,
						<br>by Cosmin Apreutesei</a>
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
			<td width=300 height=200>
				<a><img src="/img/p/{{{imgid}}}-home.jpg"></a>
			</td>
			<td>
				<b>{{{bname}}}</b> {{{name}}}
				<br>
				<span class=price>${{{price}}}</span>
				<br>
				<button type=button class=buybutton>add to bag</button>
				<br>
				<br>
			</td>
		</tr>
		{{/.}}
	</table>
</script>

<script type="text/x-mustache" id=prod_grid_element_template>
	<div pid={{{pid}}}>
		<div style="min-width: 170px; min-height: 210px">
			<a><img src="/img/p/{{{imgid}}}-home.jpg"></a>
		</div>
		<br>
		<a><b>{{{bname}}}</b> {{{name}}}</a>
		<br>
		<span class=price>${{{price}}}</span>
		<br>
		<button type=button class=buybutton pid={{{pid}}}>add to bag</button>
		<br>
		<br>
	</div>
</script>

<script type="text/x-mustache" id=brands_list_template>
	<b>Brands</b>
	<br>
	<input id=brand_search type=text style="width: 220px" placeholder="Enter Brand"></input>
	<div style="width: 220px; height: 200px; overflow: auto">
		<ul id=brands_list>
		{{#.}}
			<li><a bid={{{bid}}}>{{bname}}</a>
				<span class=gray>({{pcount}})</span></li>
		{{/.}}
		</ul>
	</div>
</script>

<script type="text/x-mustache" id=brands_template>
	<span class=small><a bid={{{bid}}}>{{bname}}</a>
		<span class=gray>({{pcount}})</span></span>
</script>

<script type="text/x-mustache" id=product_page_template>
	<br>
	<br>
	<table width=100%>
		<tr>
			<td valign=top width=600 height=400>
				<div id=gallery></div>
			</td>
			<td valign=top width=300>
				<div style="min-height: 100px">
					<img src="/img/m/{{{bid}}}.jpg">
				</div>
				<b>{{{bname}}}</b> {{{name}}}
				<br>
				<br>
				<div id=combi style="min-height: 60px"></div>
				<br>
				<table width=80% id=dimsel>
					{{#dims}}
					<tr>
						<td>{{dname}}:</td>
						<td>
							<select did={{{did}}}>
								{{#dvals}}
									<option value="{{dvid}}">{{dvname}}</option>
								{{/dvals}}
							</select>
						</td>
					</tr>
					{{/dims}}
				</table>
				<br>
				<br>
				<button type=button class="buybutton orange" pid={{{pid}}}>add to bag</button>
			</td>
		</tr>
		<tr>
			<td colspan=2>
				<br>
				<div class=description>{{{descr}}}</div>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=product_combi_template>
	<span class=big_price>{{{price}}}</span>
	<br>
	<span class=active>{{{stock}}}</span>
</script>

<script type="text/x-mustache" id=product_gallery_template>
	<div style="position: relative; z-index: 100;" id=fly_img_div></div>
	<a id=zoom>
		<img id=prod_img>
	</a>
	<div style="width: 500px; overflow: auto; white-space: nowrap">
		<table>
			<tr>
			{{#.}}
				<td align=center valign=middle class=thumb>
					<a imgid="{{{.}}}"><img src="/img/p/{{{.}}}-cart.jpg" class=inactive></a>
				</td>
			{{/.}}
			</tr>
		<table>
	</div>
</script>

</body>
</html>

