<!DOCTYPE html>
<html lang=<%=GET.lang or 'ro'%>>
<head>
	<meta charset="UTF-8">
	<title>SHOP USA</title>
	<link rel="stylesheet" type="text/css" href="/main.css">
	<link rel="stylesheet" type="text/css" href="/jquery.jqzoom.css">
	<link rel="stylesheet" type="text/css" href="/font-awesome.css">
	<script src="/jquery.js"></script>
	<script src="/mustache.js"></script>
	<script src="/util.js"></script>
	<script src="/config.js"></script>
	<script src="/jquery.history.js"></script>
	<script src="/jquery.cookie.js"></script>
	<script src="/jquery.quicksearch.js"></script>
	<script src="/jquery.jqzoom.js"></script>
	<script src="/jquery.easing.js"></script>
	<script src="/jquery.sortable.js"></script>
	<script src="/jquery.validate.js"></script>
	<script src="/browse.js"></script>
	<script src="/cat.js"></script>
	<script src="/cart.js"></script>
	<script src="/facebook.js"></script>
	<script src="/google.js"></script>
	<script src="/checkout.js"></script>
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
						<div id=cart_icon_div style="position: relative;" align=right>
							<a id=cart_icon_link>
								<img id=cart_icon>
								<div style="float: right; position: relative; top: 11px; left: -21px;">
									<span id=cart_icon_item_count></span>
								</div>
							</a>
						</div>
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
				<span class=price>
					<t class=en>${{{price}}}</t>
					<t class=ro>{{{price}}} Lei</t>
				</span>
				{{#discount}}
					<br>
					<span class=discount>
						<t class=ro>({{{discount}}}%{{#msrp}} <s>{{{msrp}}} Lei</s>{{/msrp}})</t>
						<t class=en>({{{discount}}}% off{{#msrp}} ${{{msrp}}} MSRP{{/msrp}})</t>
					</span>
				{{/discount}}
				<!--
				<br>
				<button type=button class=buybutton>
					<t class=en>add to bag</t>
					<t class=ro>adauga in cos</t>
				</button>
				-->
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
		<span class=price>
			<t class=en>${{{price}}}</t>
			<t class=ro>{{{price}}} Lei</t>
		</span>
		{{#discount}}
			<br>
			<span class=discount>
				<t class=ro>({{{discount}}}%{{#msrp}} <s>{{{msrp}}} Lei</s>{{/msrp}})</t>
				<t class=en>({{{discount}}}% off{{#msrp}} ${{{msrp}}} MSRP{{/msrp}})</t>
			</span>
		{{/discount}}
		<!--
		<br>
		<button type=button class=buybutton pid={{{pid}}}>
			<t class=en>add to bag</t>
			<t class=ro>adauga in cos</t>
		</button>
		-->
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
		<t class=en>Shopping Bag
			{{#buynow_count}}({{{buynow_count}}} items){{/buynow_count}}
			{{^buynow_count}}(empty){{/buynow_count}}
		</t>
		<t class=ro>In Cos
			{{#buynow_count}}({{{buynow_count}}} produse){{/buynow_count}}
			{{^buynow_count}}(nici un produs){{/buynow_count}}
		</t>
	</h2>
	<hr>
	{{^buynow_count}}
	<t class="gray en">Add products to your shopping bag in order to buy them.</t>
	<t class="gray ro">Adauga produse in cos pentru a le putea cumpara.</t>
	{{/buynow_count}}
	<div id=cart_buynow>{{{buynow}}}</div>
	<div class=cart_total><b>Total:</b>
		<span class=price>
			<t class=en>${{{total}}}</t>
			<t class=ro>{{{total}}} Lei</t>
		</span>
		<br>
		<br>
		{{#buynow_count}}
		<button class="checkoutbutton orange">
			<t class=en>Place Order</t>
			<t class=ro>Comanda</t>
		</button>
		{{/buynow_count}}
	</div>
	<h2>
		<t class=en>Saved for later
			{{#buylater_count}}({{{buylater_count}}} items){{/buylater_count}}
			{{^buylater_count}}(empty){{/buylater_count}}
		</t>
		<t class=ro>Pastrate pentru mai tarziu
			{{#buylater_count}}({{{buylater_count}}} produse){{/buylater_count}}
			{{^buylater_count}}(nici un produs){{/buylater_count}}
		</t>
	</h2>
	<hr>
	{{^buylater_count}}
	<t class="gray en">Drag products from your shopping bag to this area to save them for later.</t>
	<t class="gray ro">Trage produsele pe care vrei sa le cumperi cu alta ocazie in aceasta zona.</t>
	{{/buylater_count}}
	<div id=cart_buylater>{{{buylater}}}</div>
</script>

<script type="text/x-mustache" id=cart_list_template>
	<ul class=cart_list style="min-height: 200px">
	{{#.}}
		<li ciid={{{ciid}}} pid={{{pid}}} coid={{{coid}}}>
		<table><tr>
			<td width=300 height=100>
				<a><img src="/img/p/{{{imgid}}}-home.jpg"></a>
			</td>
			<td>
				<a><b>{{{bname}}}</b> {{{name}}}</a>
				<br>
				<span class=price>
					<t class=en>${{{price}}}</t>
					<t class=ro>{{{price}}} Lei</t>
				</span>
				{{#vnames}}{{.}} {{/vnames}}
				<br>
				<a action=remove><t class=en>Remove</t><t class=ro>Sterge</t></span></a>
				<span class="gray small">&nbsp;|&nbsp;</span>
				{{#buylater}}<a action=move_to_cart><t class=en>Move to cart</t><t class=ro>Muta in cos</t></a>{{/buylater}}
				{{^buylater}}<a action=buy_later><t class=en>Save for later</t><t class=ro>Pastreaza pentru mai tarziu</t></a>{{/buylater}}
			</td>
		</tr></table>
		</li>
	{{/.}}
	</ul>
</script>

<script type="text/x-mustache" id=login_section_template>
	<h3>
		<t class=en>My account:</t>
		<t class=ro>Contul meu:</t>
	</h3>
	<form id=login_form>
		<table width=100%>
			<tr>
				<td width=38% valign=top>
					<a class="btn btn_facebook">
						<i class="fa fa-facebook" style="width:16px; height:20px"></i>
							<t class=en>Sign in with Facebook</t>
							<t class=ro>Intra cu Facebook</t>
					</a>
					<a class="btn btn_google">
						<i class="fa fa-google-plus" style="width:16px; height:20px"></i>
							<t class=en>Sign in with Google</t>
							<t class=ro>Intra cu Google</t>
					</a>
					<a class="btn btn_no_account">
						<i class="fa fa-check-square-o" style="width:16px; height:18px"></i>
							<t class=en>Order without sign in</t>
							<t class=ro>Comanda fara cont</t>
					</a>
				</td>
				<td width=62% style="padding-left: 10px">
					<table width=100% style="border-spacing: 4px">
						<tr>
							<td width=1% nowrap>
								<label for=email>
									<t class=en>Email:</t>
									<t class=ro>Email:</t>
								</label>
							</td>
							<td>
								<div style="position: absolute">
									<div class=error for=email style="position: relative"></div>
								</div>
								<input id=email name=email type=text class=email required></input>
							</td>
						</tr>
						<tr>
							<td nowrap>
								<label for=pass>
									<t class=en>Password:</t>
									<t class=ro>Parola:</t>
								</label>
							</td>
							<td nowrap>
								<div style="position: absolute">
									<div class=error for=pass style="position: relative"></div>
								</div>
								<input id=pass name=pass type=password required></input>
								<t class=ro><a title="Vezi parola" class="fa fa-eye inside-right"></a></t>
								<t class=en><a title="See the password" class="fa fa-eye inside-right"></a></t>
							</td>
						</tr>
						<tr>
							<td colspan=2 align=right nowrap>
								<button type=button class=orange id=btn_login>Login</button>
								<button type=button id=btn_create_account>Creaza cont</button>
							</td>
						</tr>
						<tr>
							<td colspan=2 align=right nowrap>
								<a class=gray id=btn_forgot_pass>
									<t class=en>Forgot password?</t>
									<t class=ro>Ai uitat parola?</t>
								</a>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</form>
</script>

<script type="text/x-mustache" id=account_section_template>
	<h3>
		<t class=en>Contact details:</t>
		<t class=ro>Datele de contact:</t>
	</h3>
	<table width=100% style="border-spacing: 5px;">
		<tr>
			<td width=30%>Email:</td>
			<td>
				{{#facebookid}}
					{{email}}
				{{/facebookid}}
				{{#googleid}}
					{{email}}
				{{/googleid}}
				{{^facebookid}}{{^googleid}}
					<input id=usr_email type=text value="{{email}}">
				{{/googleid}}{{/facebookid}}
			</td>
			<td rowspan=2 align=right>
				{{#facebookid}}
					<img src="//graph.facebook.com/{{facebookid}}/picture">
				{{/facebookid}}
				{{#gimgurl}}
					<img src="{{gimgurl}}">
				{{/gimgurl}}
			</td>
		</tr>
		<tr>
			<td>
				<t class=en>Full Name:</t>
				<t class=ro>Nume:</t>
			</td>
			<td>
				{{#facebookid}}
					{{firstname}} {{lastname}}
				{{/facebookid}}
				{{#googleid}}
					{{firstname}} {{lastname}}
				{{/googleid}}
				{{^facebookid}}{{^googleid}}
					<input id=usr_name type=text value="{{firstname}} {{lastname}}">
				{{/googleid}}{{/facebookid}}
			</td>
		</tr>
		<tr>
			<td>
				<t class=en>Phone:</t>
				<t class=ro>Telefon:</t>
			</td>
			<td>
				<input id=usr_phone type=text value="{{phone}}">
			</td>
		</tr>
		<tr>
			<td colspan=3>
				<br>
				<a id=relogin class=gray>
					<t class=en>Not {{firstname}} {{lastname}}?</t>
					<t class=ro>Nu esti {{firstname}} {{lastname}}?</t>
				</a>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=checkout_cart_section_template>
	<table width=100%>
		{{#items}}
		{{^buylater}}
		<tr>
			<td>
				<div ciid={{{ciid}}} pid={{{pid}}} coid={{{coid}}}>
					<table width=100%>
						<tr>
							<td width=15%>
								<a><img src="/img/p/{{{imgid}}}-cart.jpg"></a>
							</td>
							<td>
								<a><b>{{{bname}}}</b> {{{name}}}</a>
								<br>
								<span class=price>
									<t class=en>${{{price}}}</t>
									<t class=ro>{{{price}}} Lei</t>
								</span>
								{{#vnames}}{{.}} {{/vnames}}
								<br>
								<br>
							</td>
						</tr>
					</table>
				</div>
			</td>
		</tr>
		{{/buylater}}
		{{/items}}
		<tr>
			<td align=right>
				<br>
				<br>
				<span class=subtotal>
					<t class=en>Subtotal:</t>
					<t class=ro>Subtotal:</t>
					<span class=price>
						<t class=en>${{{total}}}</t>
						<t class=ro>{{{total}}} Lei</t>
					</span>
				</span>
				<br>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=checkout_template>

	<table width=80% style="border-spacing: 10px;">

		<tr>
			<td width=75%>
				<div id=account_section></div>
			</td>
			<td width=35%></td>
		</tr>

		<tr>
			<td>
				<h3><t class=en>My Products:</t><t class=ro>Produsele comandate:</t></h3>
				<div id=cart_section></div>
			</td>
			<td></td>
		</tr>

		<tr>
			<td>
				<h3><t class=en>Delivery:</t><t class=ro>Cum le livram?</t></h3>
				<table width=100%>
					<tr>
						<td width=30>
							<input type=radio id=delivery_home name=delivery_method value=home>
						</td>
						<td>
							<label for=delivery_home>
								<t class=en>Home delivery</t>
								<t class=ro>La adresa mea, prin curier, cu plata ramburs.</t>
							</label>
						</td>
					</tr>
					<tr>
						<td>
							<input type=radio id=delivery_store name=delivery_method value=store>
						</td>
						<td>
							<label for=delivery_store>
								<t class=en>At your store</t>
								<t class=ro>Le ridic personal de la sediul shop-usa.ro, cu plata cash.</t>
							</label>
						</td>
					</tr>
				</table>
			</td>
			<td>
			</td>
		</tr>

		<tr>
			<td align=right>
				<br>
				<br>
				<span class=subtotal>
					<t class=en>Shipping cost:</t>
					<t class=ro>Cost livrare:</t>
					<span class=price>
						<t class=en>$<span class=shipping_cost></span></t>
						<t class=ro><span class=shipping_cost></span> Lei</t>
					</span>
				</span>
				<br>
			</td>
			<td>
			</td>
		</tr>

		<tr id=address_section>
			<td>
				<h3><t class=en>Delivery Address:</t><t class=ro>Adresa de livrare:</t></h3>
				<form id=addr_form>
					<table width=100% style="border-spacing: 4px">
						<tr>
							<td><label for=addr_name><t class=en>Name:</t><t class=ro>Nume:</t></label></td>
							<td><input id=addr_name type=text required></input></td>
						</tr>
						<tr>
							<td><label for=addr_phone><t class=en>Phone:</t><t class=ro>Telefon:</t></label></td>
							<td><input id=addr_phone type=text required></input></td>
						</tr>
						<tr>
							<td><label for=addr_street><t class=en>Address:</t><t class=ro>Adresa:</t></label></td>
							<td><input id=addr_street type=text placeholder="Strada, Numar, Bloc, Scara, Apart., Interfon" required></input></td>
						</tr>
						<tr>
							<td><label for=addr_city><t class=en>City:</t><t class=ro>Oras:</t></label></td>
							<td><input id=addr_city type=text placeholder="" required></input></td>
						</tr>
						<tr>
							<td><label for=addr_county><t class=en>County:</t><t class=ro>Judet/Sector:</t></label></td>
							<td><input id=addr_county type=text placeholder="" required></input></td>
						</tr>
					</table>
				</form>
			</td>
			<td>
			</td>
		</tr>

		<tr>
			<td>
				<h3>
					<t class=en>Other details (optional):</t>
					<t class=ro>Alte mentiuni (optional):</t>
				</h3>
			</td>
			<td>
			</td>
		</tr>
		<tr>
			<td>
				<textarea id=note rows=6 placeholder="Ora preferata, detalii adresa, etc."></textarea>
			</td>
			<td valign=top class=gray>
				Ne poti lasa un mesaj sau poti contacta direct operatorii nostri.
			</td>
		</tr>

		<tr>
			<td align=right>
				<br>
				<br>
				<span class=subtotal>Total:
					<span class=price>
						<t class=en>$<span class=grand_total></span></t>
						<t class=ro><span class=grand_total></span> Lei</t>
					</span>
				</span>
				<br>
				<br>
				<button type=button class="orderbutton orange">
					<t class=en>Place Order</t>
					<t class=ro>Comanda</t>
				</button>
			</td>
			<td>
			</td>
		</tr>

	</table>
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
