<?
if GET._escaped_fragment_ then
	action('app.google', ...)
	return
end
?><!DOCTYPE html>
<html lang=<?=lang()?>>
<head>
	<meta charset="UTF-8">
	<title>SHOP USA</title>
	<meta name="fragment" content="!">
	<link rel="stylesheet" type="text/css" href="/main.css">
	<link rel="stylesheet" type="text/css" href="/jquery.jqzoom.css">
	<link rel="stylesheet" type="text/css" href="/jquery.toasty.css">
	<link rel="stylesheet" type="text/css" href="/jquery.powertip.css">
	<link rel="stylesheet" type="text/css" href="/font-awesome.css">
	<script src="/jquery.js"></script>
	<script src="/jquery.history.js"></script>
	<script src="/jquery.cookie.js"></script>
	<script src="/jquery.quicksearch.js"></script>
	<script src="/jquery.jqzoom.js"></script>
	<script src="/jquery.easing.js"></script>
	<script src="/jquery.sortable.js"></script>
	<script src="/jquery.validate.js"></script>
	<script src="/jquery.autocomplete.js"></script>
	<script src="/jquery.toasty.js"></script>
	<script src="/jquery.powertip.js"></script>
	<script src="/mustache.js"></script>
	<script src="/webb.js"></script>
	<script src="/config.js"></script>
	<script src="/analytics.js"></script>
	<script src="/facebook.js" async defer></script>
	<script src="/google.js" async defer></script>
	<script src="/cat.js"></script>
	<script src="/cart.js"></script>
	<script src="/status.js"></script>
	<script src="/account.js"></script>
	<script src="/checkout.js"></script>
	<script src="/resetpass.js"></script>
	<script src="/browse.js"></script>
	<script src="/app.js"></script>
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
			<div id=topbar style="height: 30px"></div>
			<table width=100% id=letters>
				<tr valign=top height=40>
					<?
					local letters = {'#'}
					for byte = string.byte'A', string.byte'Z' do
						table.insert(letters, string.char(byte))
					end
					local w = 900 / #letters
					for i,letter in ipairs(letters) do
						local search = letter == '#' and 'other' or letter
						?>
						<td align=center width=<?=w?>>
							<a search=<?=search?>><?=letter?></a>
						</td>
						<?
					end
					?>
				</tr>
			</table>
			<table width=100%>
				<tr>
					<td>
						<a id=greeting_anonymous class=hidden>
							<t class=en>Hi</t><t class=ro>Salut</t>!
						</a>
						<span id=greeting_logged_in class=hidden>
							<t class=en>Hi</t>
							<t class=ro>Salut</t>
							<a id=greeting_name></a>!
						</span>
					</td>
					<td align=right nowrap>
						<div id=cart_icon_div style="position: relative; width: 50px; height: 50px">
							<a id=cart_icon_link>
								<img style="position: absolute" id=cart_icon>
								<div style="position: absolute; top: 11px; left: 28px">
									<span id=cart_icon_item_count></span>
								</div>
							</a>
						</div>
					</td>
				</tr>
			</table>
			<table width=100% id=top_navbar class="navbar hidden">
				<tr>
					<td valign=middle>
						<table>
							<tr>
								<td><a viewstyle=grid><img src="/grid.png"></a></td>
								<td width=4></td>
								<td><a viewstyle=list><img src="/list.png"></a></td>
							</tr>
						</table>
					</td>
					<td vlign=middle align=right>
						<div class="pagenav small"></div>
					</td>
				</tr>
			</table>
			<div id=main></div>
			<table width=100% id=bottom_navbar class="navbar hidden">
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

<script type="text/x-mustache" id=topbar_template>
	<table style="float: right;">
		<tr>
		{{#items}}
			<td valign=middle style="padding-left: 30px; padding-right: 30px;">
				<a catid={{{catid}}}>{{{catname}}}</a>
			</td>
		{{/items}}
		</tr>
	</table>
</script>

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
				<button type=button class=add_to_cart>
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
	<div pid={{{pid}}} class=drop style="margin: 5px">
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
		<button type=button class=add_to_cart pid={{{pid}}}>
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
	<input id=brand_search type=text style="width: 220px" placeholder="Brand">
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
					<a class=brandlink><img src="/img/m/{{{bid}}}.jpg"></a>
				</div>
				<a class=brandlink><b>{{{bname}}}</b></a> {{{name}}}
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
				<button type=button id=add_to_cart class=orange pid={{{pid}}}>
					<t class=en>add to bag</t>
					<t class=ro>adauga in cos</t>
				</button>
			</td>
		</tr>
		<tr>
			<td colspan=2>
				<br>
				<br>
				<div class=description>{{{descr}}}</div>
				<br>
				<br>
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

	<t class=en><h1>Shopping cart</h1></t>
	<t class=ro><h1>Cosul de cumparaturi</h1></t>

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
	<span class=gray>
		<t class=en>Add products to your shopping bag in order to buy them.</t>
		<t class=ro>Adauga produse in cos pentru a le putea cumpara.</t>
	</span>
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
		<button id=btn_checkout class=orange>
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
			<span class=help>
				Ti-ai selectat multe produse dar ti-a dat seama ca nu le poti cumpara
				pe toate acum, dar ti-ai dori sa le cumperi alta data? Nu-i nimic!
				Aici te ajutam noi: acum iti poti pastra produsele selectate in
				aceasta lista care se va pastra in contul tau, astfel incat sa nu
				pierzi nimic. Si daca iti selctezi iarna produse pentru vara, nu-ti
				face griji! Noi iti vom pastra lista pana atunci!
			</span>
		</t>
	</h2>
	<hr>
	{{^buylater_count}}
	<span class=gray>
		<t class=en>
			Drag products from your shopping bag to this area to save them for later.
		</t>
		<t class=ro>
			Trage produsele pe care vrei sa le cumperi cu alta ocazie in aceasta zona.
		</t>
	</span>
	{{/buylater_count}}
	<div id=cart_buylater>{{{buylater}}}</div>
</script>

<script type="text/x-mustache" id=cart_list_template>
	<ul class=cart_list style="min-height: 200px">
	{{#.}}
		<li ciid={{{ciid}}} pid={{{pid}}} coid={{{coid}}}>
			<table width=100%>
				<tr>
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
						{{#buylater}}
							<a action=move_to_cart><t class=en>Move to cart</t><t class=ro>Muta in cos</t></a>
						{{/buylater}}
						{{^buylater}}
							<a action=buy_later><t class=en>Save for later</t><t class=ro>Pastreaza pentru mai tarziu</t></a>
						{{/buylater}}
					</td>
					<td align=right valign=top>
						<span class="gray small">
							<t class=en>Added</t>
							<t class=ro>Adaugat</t>
							<span class=timeago timeago="{{atime_ago}}"></span>
						</span>
					</td>
				</tr>
			</table>
		</li>
	{{/.}}
	</ul>
</script>

<script type="text/x-mustache" id=account_login_template>
	<t class=en>
		<h3>Enter account:</h3>
	</t>
	<t class=ro>
		<h3>Intra in cont:</h3>
		<span class=help>
			De ce sa te inregistrezi? Pentru ca asa iti poti pastra produsele
			care ti-au placut intr-o lista de preferinte, pe care o vei gasi si
			data viitoare cand ne vizitezi!
		</span>
	</t>
	<form id=login_form>
		<table width=100%>
			<tr>
				<td width=38% valign=top>
					<a class=btn id=btn_facebook>
						<i class="fa fa-facebook" style="width:16px; height:20px"></i>
							<t class=en>Sign in with Facebook</t>
							<t class=ro>Intra cu Facebook</t>
					</a>
					<a class=btn id=btn_google>
						<i class="fa fa-google-plus" style="width:16px; height:20px"></i>
							<t class=en>Sign in with Google</t>
							<t class=ro>Intra cu Google</t>
					</a>
					<a class=btn id=btn_no_account>
						<i class="fa fa-check-square-o" style="width:16px; height:18px"></i>
							<t class=en>Order without sign in</t>
							<t class=ro>Comanda fara cont</t>
					</a>
				</td>
				<td width=62% style="padding-left: 10px">
					<table width=100% style="border-spacing: 4px">
						<tr>
							<td width=1 nowrap>
								<label for=email>Email:</label>
							</td>
							<td nowrap>
								<div class=errdiv1><div for=email class="error errdiv2"></div></div>
								<input id=email name=email type=text class=email
									placeholder="name@domain.com" required>
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
								<div class=errdiv1><div for=pass class="error errdiv2"></div></div>
								<input id=pass name=pass type=password required>
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

<script type="text/x-mustache" id=account_info_template>
	<h3>
		<t class=en>Contact details:</t>
		<t class=ro>Datele de contact:</t>
	</h3>
	<form id=usr_form>
		<table width=100% style="border-spacing: 5px;">
			<tr>
				<td width=30%>
					<label for=usr_email>Email:</label>
				</td>
				<td>
					<div class=errdiv1><div for=usr_email class="error errdiv2"></div></div>
					<input id=usr_email name=usr_email class=email type=text
						value="{{email}}" placeholder="name@domain.com" required>
				</td>
				<td rowspan=4 align=right valign=top>
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
					<div class=errdiv1><div for=usr_name class="error errdiv2"></div></div>
					<input id=usr_name name=usr_name type=text value="{{name}}" placeholder="Nume Complet" required></t>
				</td>
			</tr>
			<tr>
				<td>
					<t class=en>Phone:</t>
					<t class=ro>Telefon:</t>
				</td>
				<td align=right>
					<div class=errdiv1><div for=usr_phone class="error errdiv2"></div></div>
					<input id=usr_phone name=usr_phone type=text value="{{phone}}" required>
				</td>
			</tr>
			{{#show_operations}}
			<tr>
				<td colspan=2 align=right>
					<button type=button id=btn_cancel class=hidden>
						<t class=en>Cancel</t>
						<t class=ro>Anuleaza</t>
					</button>
					<button type=button id=btn_save class=orange disabled>
						<t class=en>Save</t>
						<t class=ro>Salveaza</t>
					</button>
				</td>
			</tr>
			{{/show_operations}}
			<tr>
				<td colspan=2>
					<br>
					<table width=100%>
						<tr>
							<td nowrap>
								{{#firstname}}
								<a id=relogin class=gray>
									<t class=en>Not {{firstname}}?</t>
									<t class=ro>Nu esti {{firstname}}?</t>
								</a>
								{{/firstname}}
							</td>
							{{#show_operations}}
							<td align=right nowrap>
								{{#haspass}}
									<a id=reset_pass class=gray>
										<t class=en>Change password</t>
										<t class=ro>Schimba parola</t>
									</a> |
								{{/haspass}}
								<a id=logout class=gray>
									<t class=en>Log out</t>
									<t class=ro>Iesi din cont</t>
								</a>
							</td>
							{{/show_operations}}
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</form>
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
							<td align=right></td>
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

	<t class=en><h1>Checkout</h1></t>
	<t class=ro><h1>Comanda</h1></t>

	<table width=80% style="border-spacing: 10px;">

		<tr>
			<td width=75%>
				<div id=account_section></div>
			</td>
			<td width=35%></td>
		</tr>

		<tr>
			<td>
				<h3>
					<t class=en>Products to buy:</t>
					<t class=ro>Produsele comandate:</t>
				</h3>
				<div id=cart_section></div>
			</td>
			<td></td>
		</tr>

		<tr>
			<td>
				<h3>
					<t class=en>Shipping:</t>
					<t class=ro>Livrare si plata:</t>
				</h3>
				<table width=100%>
					<tr>
						<td width=30>
							<input type=radio id=shipping_home name=shipping_method value=home>
						</td>
						<td>
							<label for=shipping_home>
								<t class=en>Ship to my address, cash on delivery.</t>
								<t class=ro>La adresa mea, prin curier, cu plata ramburs.</t>
							</label>
						</td>
					</tr>
					<tr>
						<td>
							<input type=radio id=shipping_store name=shipping_method value=store>
						</td>
						<td>
							<label for=shipping_store>
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
				<h3>
					<t class=en>Shipping Address:</t>
					<t class=ro>Adresa de livrare:</t>
				</h3>
				<form id=addr_form>
					<table width=100% style="border-spacing: 4px">
						<tr>
							<td>
								<label for=addr_street>
									<t class=en>Address:</t>
									<t class=ro>Adresa:</t>
								</label>
							</td>
							<td>
								<div class=errdiv1><div for=addr_street class="error errdiv2"></div></div>
								<input id=addr_street name=addr_street type=text required>
							</td>
						</tr>
						<tr>
							<td>
								<label for=addr_city>
									<t class=en>City:</t>
									<t class=ro>Oras:</t>
								</label>
							</td>
							<td>
								<div class=errdiv1><div for=addr_city class="error errdiv2"></div></div>
								<input id=addr_city name=addr_city type=text placeholder="" required>
							</td>
						</tr>
						<tr>
							<td>
								<label for=addr_county>
									<t class=en>County:</t>
									<t class=ro>Judet:</t>
								</label>
							</td>
							<td>
								<div class=errdiv1><div for=addr_county class="error errdiv2"></div></div>
								<input id=addr_county name=addr_county type=text placeholder="" required>
							</td>
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
				<textarea id=order_note rows=6 placeholder="Ora preferata, detalii adresa, etc."></textarea>
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
				<button type=button id=btn_place_order class=orange>
					<t class=en>Place Order</t>
					<t class=ro>Comanda</t>
				</button>
			</td>
			<td>
			</td>
		</tr>

	</table>
</script>

<script type="text/x-mustache" id=order_placed_template>
	<t class=en>
		<h1>Thank you for ordering from us!</h1>

		Your order will be processed shortly and we will call you for confirmation.
	</t>
	<t class=ro>
		<h1>Iti multumim ca ai comandat de la noi!</h1>

		In cel mai scurt timp, comanda ta va fi preluata de unul dintre
		operatorii nostrii si vei primi un telefon pentru confirmare.
	</t>
	<br>
	<br>
	<br>
	<br>
</script>

<script type="text/x-mustache" id=forgot_pass_template>
	<form id=forgot_pass_form>
		<table width=50% height=400 style="border-spacing: 5px">
			<tr height=100><td> </td></tr>
			<tr height=1>
				<td colspan=3 valign=top>
					<t class=en>
						Enter your email below, and we will send you an email with a link
						that will allow you to login and reset your password.
					</t>
					<t class=ro>
						Introdu adresa de email in campul de mai jos, si iti vom trimite
						un mesaj cu un link care te va ajuta sa iti schimbi parola.
					</t>
					<br>
					<br>
				</td>
			</tr>
			<tr height=1>
				<td width=1 valign=top class=nowrap>
					<label for=email>Email: </label>
				</td>
				<td valign=top>
					<input type=text id=email name=email class=email required>
				</td>
				<td width=1 valign=top class=nowrap>
					<button class=orange id=btn_send_email>
						<t class=en>Send email</t>
						<t class=ro>Trimite email</t>
					</button>
				</td>
			</tr>
			<tr>
				<td></td>
				<td colspan=2 valign=top>
					<div id=validation_error class=error></div>
					<div id=server_error class="error hidden">
						<t class=en>There was an error. Please try again.</t>
						<t class=ro>S-a produs o eroare. Te rog sa incerci din nou.</t>
					</label>
				</td>
			</tr>
		</table>
	</form>
</script>

<script type="text/x-mustache" id=reset_pass_template>
	<t class=en><h1>Change password</h1></t>
	<t class=ro><h1>Schimba parola</h1></t>
	<form id=reset_pass_form>
		<table width=50% height=400 style="border-spacing: 5px">
			<tr height=50>
				<td colspan=2> </td>
			</tr>
			<tr height=1>
				<td colspan=3 valign=top>
					<t class=en>Enter your new password.</t>
					<t class=ro>Introdu noua parola.</t>
					<br>
				</td>
			</tr>
			<tr height=1>
				<td valign=top>
					<input type=password id=pass name=pass class=pass autocomplete=off required>
				</td>
				<td width=1 valign=top class=nowrap>
					<button class=orange id=btn_reset_pass>
						<t class=en>Change password</t>
						<t class=ro>Schimba parola</t>
					</button>
				</td>
			</tr>
			<tr>
				<td height=30 colspan=2 valign=top>
					<div id=validation_error class=error></div>
					<div id=server_error class="error hidden">
						<t class=en>There was an error. Please try again.</t>
						<t class=ro>S-a produs o eroare. Te rog sa incerci din nou.</t>
					</label>
				</td>
			</tr>
			<tr>
				<td colspan=3 valign=top>
					<t class=en><a class=a_account>Back to account</a></t>
					<t class=ro><a class=a_account>Inapoi la cont</a></t>
					<br>
					<t class=en><a class=a_home>Back to shopping</a></t>
					<t class=ro><a class=a_home>Inapoi la cumparaturi</a></t>
				</td>
			</tr>
		</table>
	</form>
</script>

<script type="text/x-mustache" id=message_template>
	<table width=50% height=400 style="border-spacing: 5px">
		<tr height=100><td> </td></tr>
		<tr>
			<td valign=top>{{{message}}}</td>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=token_sent_template>
	<t class=en>
		A message with the link to reset your password has been sent
		to your email address. Please check your inbox and continue from there.
	</t>
	<t class=ro>
		Un mesaj cu linkul pentru schimbarea parolei a fost trimis pe adresa ta.
		Te rugam sa-ti verifici mail-ul pentru a continua.
	</t>
</script>

<script type="text/x-mustache" id=password_changed_template>
	<t class=en>Your password was changed.</t>
	<t class=ro>Parola a fost schimbata.</t>
	<br>
	<br>
	<t class=en><a class=a_account>Back to account</a></t>
	<t class=ro><a class=a_account>Inapoi la cont</a></t>
	<br>
	<t class=en><a class=a_home>Back to shopping</a></t>
	<t class=ro><a class=a_home>Inapoi la cumparaturi</a></t>
</script>

<script type="text/x-mustache" id=account_template>
	<t class=en><h1>Account</h1></t>
	<t class=ro><h1>Contul meu</h1></t>
	<table width=80% style="border-spacing: 10px;">
		<tr>
			<td width=75%>
				<div id=account_section></div>
			</td>
			<td width=35%></td>
		</tr>
		<tr>
			<td>
				<div id=orders_section></div>
			</td>
			<td></td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=orders_template>
	<h3>
		<t class=en>Past Order:</t>
		<t class=ro>Istoric Comenzi:</t>
	</h3>
	{{#orders}}
	<table width=100% style="border-spacing: 5px;">
		<tr>
			<td>
				<h4>Comanda din {{atime}}</h4>
				<table width=100%>
					{{#items}}
					<tr>
						<td>
							{{coid}}
						</td>
					</tr>
					{{/items}}
				</table>
			</td>
		</tr>
	</table>
	{{/orders}}
	{{^orders}}
	<span class=gray>
		<t lang=en>There are no past orders.</t>
		<t lang=ro>Nu ai facut inca nici o comanda.</t>
	</span>
	{{/orders}}
</script>


<div id=fb-root class=hidden></div>
</body>
</html>
