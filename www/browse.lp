<!DOCTYPE html>
<html lang=ro>
<head>
	<meta charset="UTF-8">
	<title>SHOP USA</title>
	<link rel="stylesheet" type="text/css" href="/main.css">
	<link rel="stylesheet" type="text/css" href="/jquery.jqzoom.css">
	<script src="/jquery.js"></script>
	<script src="/mustache.js"></script>
	<script src="/util.js"></script>
	<script src="/strings.ro.js"></script>
	<script src="/jquery.history.js"></script>
	<script src="/jquery.cookie.js"></script>
	<script src="/jquery.quicksearch.js"></script>
	<script src="/jquery.jqzoom.js"></script>
	<script src="/jquery.easing.js"></script>
	<script src="/jquery.sortable.js"></script>
	<link rel="stylesheet" href="/font-awesome/css/font-awesome.min.css">
	<script src="/browse.js"></script>
	<script src="/cat.js"></script>
	<script src="/cart.js"></script>
</head>
<body>
<table>
	<tr>
		<td valign=top width=280>
			<a href=/><img src="/logo.jpg"></a>
			<br>
			<br>
			<div id=sidebar>
				<div id=cat class=menu></div>
				<br>
				<div id=brands class=menu></div>
			</div>
		</td>
		<td valign=top width=900>
			<div id=topbar></div>
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
				<tr>
					<td></td>
					<td align=right style="text-align: right;">
						<a id=cart_icon_link>
							<div id=cart_icon_div style="position: relative;" align=right>
								<img id=cart_icon>
								<div style="float: right; position: relative; top: 11px; left: -21px;">
									<span id=cart_item_count></span>
								</div>
							</div>
						</a>
					</td>
				</tr>
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
						<span class=gray>
							Made with
								<a href="http://luapower.com/" target=_blank>Lua Power</a>,
								Love, Spice, and
								<a href="http://openresty.org/" target=_blank>Everything Nice</a>,
								<br>
								by Cosmin Apreutesei
						</span>
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
				<a><b>{{{bname}}}</b> {{{name}}}</a>
				<br>
				<span class=price><t class=en>$</t>{{{price}}}<t class=ro> Lei</t></span>
				<span class=discount>{{{discount}}}</span>
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
	<div pid={{{pid}}} class=drop>
		<div style="min-width: 170px; min-height: 250px">
			<a><img src="/img/p/{{{imgid}}}-home.jpg"></a>
		</div>
		<br>
		<a><b>{{{bname}}}</b> {{{name}}}</a>
		<br>
		<span class=price><t class=en>$</t>{{{price}}}<t class=ro> Lei</t></span>
		{{#discount}}
			<br>
			<span class=discount>
				<t class=ro>({{{discount}}}% {{#msrp}} din {{{msrp}}} Lei{{/msrp}})</t>
				<t class=en>({{{discount}}}% off{{#msrp}} ${{{msrp}}} MSRP{{/msrp}})</t>
			</span>
		{{/discount}}
		<br>
		<button type=button class=buybutton pid={{{pid}}}>
			<t class=en>add to bag</t>
			<t class=ro>adauga in cos</t>
		</button>
		<br>
		<br>
	</div>
</script>

<script type="text/x-mustache" id=brands_list_template>
	<b>Brands</b>
	<br>
	<input id=brand_search type=text style="width: 220px" placeholder="Brand"></input>
	<div style="width: 220px; height: 200px; overflow: auto">
		<ul id=brands_list>
		{{#.}}
			<li><a bid={{{bid}}}>{{{bname}}}</a>
				<span class=gray>({{pcount}})</span></li>
		{{/.}}
		</ul>
	</div>
</script>

<script type="text/x-mustache" id=brands_template>
	<span class=small><a bid={{{bid}}}>{{{bname}}}</a>
		<span class=gray>({{pcount}})</span>
	</span>
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
									<option value="{{{dvid}}}" {{{selected}}}>{{dvname}}</option>
								{{/dvals}}
							</select>
						</td>
					</tr>
					{{/dims}}
				</table>
				<br>
				<br>
				<button type=button class="buybutton orange" pid={{{pid}}}>
					<t class=en>add to bag</t>
					<t class=ro>adauga in cos</t>
				</button>
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

<script type="text/x-mustache" id=brand_page_template>
	<b>{{bname}}</b>
	<br>
	<br>
	<div style="min-height: 100px;">
		<a bid={{{bid}}}><img src="/img/m/{{{bid}}}.jpg"></a>
	</div>
	<div id=bcat class=menu></div>
</script>

<script type="text/x-mustache" id=cart_page_template>
	<h2>
		<t class=en>Shopping Bag</t>
		<t class=ro>In Cos</t>
	</h2>
	<hr>
	<div id=cart_buy_now>{{{buy_now}}}</div>
	<div class=cart_total><b>Total:</b>
		<span class=price>
			<t class=en>${{{total}}}</t>
			<t class=ro>{{{total}}} Lei</t>
		</span>
		<br>
		<button class=buybutton><t class=en>Buy</t><t class=ro>Comanda</t></button>
	</div>
	<h2>
		<t class=en>Saved for later ({{{buylater_count}}} items)</t>
		<t class=ro>Pastrate ({{{buylater_count}}} produse)</t>
	</h2>
	<hr>
	<div id=cart_buy_later>{{{buy_later}}}</div>
</script>

<script type="text/x-mustache" id=cart_list_template>
	<ul class=cart_list>
	{{#.}}
		<li ciid={{{ciid}}} pid={{{pid}}} coid={{{coid}}}>
		<table><tr>
			<td width=300 height=100>
				<a><img src="/img/p/{{{imgid}}}-home.jpg"></a>
			</td>
			<td>
				<a><b>{{{bname}}}</b> {{{name}}}</a>
				<br>
				<span class=price>${{{price}}}</span>
				<span class=discount>{{{discount}}}</span>
				{{#vnames}}{{.}} {{/vnames}}
				<br>
				<a action=remove><t class=en>Remove</t><t class=ro>Sterge</t></span>
				</a> |
				{{#buylater}}<a action=move_to_cart><t class=en>Move to cart</t><t class=ro>Muta in cos</t></a>{{/buylater}}
				{{^buylater}}<a action=buy_later><t class=en>Save for later</t><t class=ro>Pastreaza</t></a>{{/buylater}}
				<br>
				<br>
			</td>
		</tr></table>
		</li>
	{{/.}}
	</ul>
</script>

<script type="text/x-mustache" id=topbar_template>
	<table style="float: right;">
		<tr>
		{{#items}}
			<td valign=middle height=40 style="padding-left: 30px; padding-right: 30px;">
				<a catid={{{catid}}}>{{{catname}}}</a>
			</td>
		{{/items}}
		</tr>
	</table>
</script>

</body>
</html>
