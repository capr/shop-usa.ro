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
	<link rel="stylesheet" type="text/css" href="/all.css">
	<script src="/all.js"></script>
</head>
<body>
<table>
	<tr>
		<td valign=top width=280>
			<a href="/"><img src="/logo.jpg" style="margin-top: 26px"></a>
			<br>
			<br>
			<div id=sidebar>
				<div id=cat class=menu></div>
				<br>
				<div id=brands class=menu></div>
				<br>
				<div id=filters class=menu></div>
			</div>
		</td>
		<td valign=top width=900 height=700>
			<br>
			<table width=100%>
				<tr>
					<td valign=bottom>
					</td>
					<td valign=bottom class=nowrap align=left
						style="line-height: 100%; border-right: 1px solid #ccc;">
						<form id=nl_form>
							<label class=small for=nl_email>
								<t class=en>Stay up-to-date with our latest offers</t>
								<t class=ro>Aboneaza-te la newsletter</t>
							</label>
							<br>
							<input
								placeholder:en="your email here"
								placeholder:ro="email-ul tau aici"
								style="width: 200px; margin: 0px;"
								id=nl_email name=email type=text class=email required>
							<button type=button id=nl_subscribe class=slim
								style="width: 36px; padding: 0; margin-right: 20px;">OK</button>
							<div class=errdiv1><div for=nl_email class="error errdiv2 small"></div></div>
						</form>
					</td>
					<td width=200 valign=bottom align=right class=nowrap style="line-height: 100%; border-right: 1px solid #ccc">
						<div style="margin-right: 20px;">
							<b>
								<a href="/contact">CONTACT</a><br>
								<a href="/faq">
									<t class=en>F.A.Q.</t>
									<t class=ro>INTREBARI</t>
								</a>
							</b>
						</div>
					</td>
					<td width=206 valign=bottom align=right class=nowrap style="border-right: 1px solid #ccc">
						<div style="position: relative; top: 4px; margin-right: 20px;">
							<i class="fa fa-phone" style="font-size: 22px"></i>
							<span style="font-size: 24px; line-height: 100%">0745 577 786</span>
						</div>
					</td>
					<td width=200 valign=bottom align=right class=nowrap style="line-height: 100%">
						<t class=en>
							<b>FREE SHIPPING</b><br>
							on all orders over 300 RON
						</t>
						<t class=ro>
							<b>TRANSPORT GRATUIT</b><br>
							la comenzi de peste 300 Lei
						</t>
					</td>
				</tr>
			</table>
			<br>
			<div id=topbar style="height: 22px"></div>
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
						<td align=right width=<?=w?>>
							<a href="/brands/<?=search?>"><?=letter?></a>
						</td>
						<?
					end
					?>
				</tr>
			</table>
			<table width=100%>
				<tr>
					<td width=60%>
						<input id=search type=text
							placeholder:ro="cauta produse dupa nume, cod, brand, etc."
							placeholder:en="search for products by name, sku, brand, etc."
						></input>
					</td>
					<td width=1 class=nowrap>
						<button type=button id=btn_search class=slim>
							<i class="fa fa-search"></i> Cauta
						</button>
					</td>
					<td align=right>
						<a id=greeting_anonymous href="/account" class="link hidden"><t class=en>Login</t><t class=ro>Logheaza-te</t></a>
						<span id=greeting_logged_in class="nowrap hidden">
							<t class=en>Hi</t>
							<t class=ro>Salut</t>
							<a id=greeting_name href="/account" class=link></a>!
						</span>
						&nbsp;
						&nbsp;
					</td>
					<td width=1>
						<a id=orders_icon href="/orders" class="fa fa-cutlery hidden" title:en=orders title:ro=comenzi></a>
					</td>
					<td width=1 align=right class=nowrap>
						<div id=cart_icon_div style="position: relative; width: 50px; height: 50px">
							<a href="/cart">
								<img style="position: absolute" id=cart_icon>
								<div style="position: absolute; top: 11px; left: 28px">
									<span id=cart_icon_item_count></span>
								</div>
							</a>
						</div>
					</td>
				</tr>
			</table>
			<div id=main></div>
			<a class="cd-top">Top</a>
		</td>
	</tr>
</table>
<br>
<br>
<table>
	<tr>
		<td valign=top width=280></td>
		<td align=left valign=top width=900>
			<hr>
			<a class=gray href="/about">Despre noi</a><br>
			<a class=gray href="/howto">Cum comand</a><br>
			<a class=gray href="/refund">Politica de returnare</a><br>
			<a class=gray href="/faq">Intrebari frecvente</a><br>
			<a class=gray href="/tos">Termeni si conditii</a><br>
			<a class=gray href="/confidentiality">Confidentialitate</a><br>
			<a class=gray href="http://www.anpc.gov.ro/" target=_blank>ANPC</a>
			<br>
			<br>
			<table width=100%>
				<tr>
					<td align=center class="gray small">
						SHOP-USA |
						str. Atena nr. 4, Bucuresti, Sector 1, Tel: 0745 577 786 |
						Website by <a href="http://luapower.com/cosmin" target=_blank>Cosmin Apreutesei</a>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>

<script type="text/x-mustache" id=filters_template>
<ul>
{{#.}}
	<li>
		<b>{{{dname}}}</b>
		<ul>
		{{#values}}
			<li>{{{dvname}}} <span class=gray> ({{{count}}})</span></li>
		{{/values}}
		</ul>
	</li>
{{/.}}
</ul>
</script>

<script type="text/x-mustache" id=browse_template>
	<table width=100% id=top_navbar class=navbar>
		<tr>
			<td valign=middle width=60>
				<table>
					<tr>
						<td><a viewstyle=grid><img src="/grid.png"></a></td>
						<td width=4></td>
						<td><a viewstyle=list><img src="/list.png"></a></td>
					</tr>
				</table>
			</td>
			<td class="small nowrap">
				<b class=gray>
					<t class=en>Order by: </t>
					<t class=ro>Ordoneaza dupa: </t>
				</b>
				<a order=date class=link><t class=en>Newest first</t><t class=ro>Noutate</t></a> |
				<a order=price class=link><t class=en>Price</t><t class=ro>Pret</t></a> |
				<a order=discount class=link><t class=en>Discount</t><t class=ro>Discount</t></a>
			</td>
			<td vlign=middle align=right width=200 class=nowrap>
				<div class="pagenav small"></div>
			</td>
		</tr>
	</table>
	<div id=prods></div>
	<table width=100% id=bottom_navbar class=navbar>
		<tr>
			<td align=right>
				<div class=pagenav></div>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=topbar_template>
	<table style="float: right;">
		<tr>
		{{#items}}
			<td valign=middle style="padding-left: 20px; padding-right: 0px;">
				<a href="/cat/{{{catid}}}">{{{catname}}}</a>
			</td>
		{{/items}}
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=prod_list_template>
	<table width=100%>
		{{#.}}
		<tr pid={{{pid}}}>
			<td width=210 height=200>
				<a href="/p/{{{slug}}}"><img src="/img/p/{{{imgid}}}-home.jpg"></a>
			</td>
			<td>
				<a href="/p/{{{slug}}}"><b>{{{bname}}}</b> {{{name}}}</a>
				<br>
				<span class=price>
					<t class=en>{{{price}}} RON</t>
					<t class=ro>{{{price}}} Lei</t>
				</span>
				{{#discount}}
					<br>
					<span class=discount>
						<t class=en>({{{discount}}}% off{{#msrp}} {{{msrp}}} MSRP{{/msrp}})</t>
						<t class=ro>({{{discount}}}%{{#msrp}} <s>{{{msrp}}} Lei</s>{{/msrp}})</t>
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
		<div style="min-width: 170px; min-height: 210px">
			<a href="/p/{{{slug}}}"><img src="/img/p/{{{imgid}}}-home.jpg"></a>
		</div>
		<a href="/p/{{{slug}}}"><b>{{{bname}}}</b> {{{name}}}</a>
		<br>
		<span class=price>
			<t class=en>{{{price}}} RON</t>
			<t class=ro>{{{price}}} Lei</t>
		</span>
		{{#discount}}
			<br>
			<span class=discount>
				<t class=ro>({{{discount}}}%{{#msrp}} <s>{{{msrp}}} Lei</s>{{/msrp}})</t>
				<t class=en>({{{discount}}}% off{{#msrp}} {{{msrp}}} MSRP{{/msrp}})</t>
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
			<li>
				<a bid={{{bid}}}>{{{bname}}}</a>
				<span class=gray>({{pcount}})</span>
			</li>
		{{/.}}
		</ul>
	</div>
</script>

<script type="text/x-mustache" id=brands_template>
	<span class=small><a href="/brand/{{{slug}}}">{{{bname}}}</a>
		<span class=gray>({{pcount}})</span>
	</span>
</script>

<script type="text/x-mustache" id=product_page_template>
	<a id=a_back>&laquo; <t class=en>Back</t><t class=ro>Inapoi</t></a>
	<span class="gray small">&nbsp; | &nbsp;</span>
	{{#path}}<a href="/cat/{{{slug}}}">{{{catname}}}</a> {{^last}} &gt; {{/last}}{{/path}}
	<br>
	<br>
	<table width=100%>
		<tr>
			<td valign=top width=600 height=400>
				<div id=gallery></div>
			</td>
			<td valign=top width=300>
				<div style="min-height: 100px">
					<a href="/brand/{{{bid}}}"><img src="/img/m/{{{bid}}}.jpg"></a>
				</div>
				<span style="font-size: 130%">
					<a href="/brand/{{{bid}}}"><b>{{{bname}}}</b></a> {{{name}}}
				</span>
				<br>
				<br>
				<b>
					<t class=en>PRODUCT CODE:</t>
					<t class=ro>COD PRODUS:</t>
					<span class=price>{{{pid}}}</span>
				</b>
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
				<button type=button id=add_to_cart class=orange>
					<t class=en>add to bag</t>
					<t class=ro>adauga in cos</t>
				</button>
				<br>
				<div id=add_to_order></div>
			</td>
		</tr>
		<tr>
			<td colspan=2>
				<h3>
					<t class=en>Product Information</t>
					<t class=ro>Informatii Produs</t>
				</h3>
				<div class=description>{{{descr}}}</div>
				<br>
				<br>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=add_to_order_template>
	<br>
	{{#orders}}
		{{#open}}
		<button type=button oid={{{oid}}} style="margin-bottom: 5px;">
			<t class=en>add to order #{{{oid}}}</t>
			<t class=ro>adauga la comanda {{{oid}}}</t>
		</button>
		{{/open}}
	{{/orders}}
</script>

<script type="text/x-mustache" id=product_combi_template>
	<span class=big_price>{{{price}}}</span>
	<br>
	<span class=active>{{{stock}}}</span>
</script>

<script type="text/x-mustache" id=product_gallery_template>
	<div style="position: relative; z-index: 100;" id=fly_img_div></div>
	<div style="min-height: 370px">
		<a id=a_prod_img></a>
	</div>
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
		<img src="/img/m/{{{bid}}}.jpg">
	</div>
	<b>Categoriile care contin produse {{bname}}:</b>
	<div id=bcat class=menu></div>
</script>

<script type="text/x-mustache" id=cart_page_template>

	<h1>
		<t class=en>Shopping cart</t>
		<t class=ro>Cosul de cumparaturi</t>
	</h1>

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
	{{#buynow_count}}
	<table width=100% class=cart_subtotal>
		<tr>
			<td align=right>
				Subtotal:
			</td>
			<td width=15></td>
			<td align=right class="price nowrap" width=1>
				<t class=en>{{{subtotal}}} RON</t>
				<t class=ro>{{{subtotal}}} Lei</t>
			</td>
		</tr>
		<tr>
			<td align=right>
				<t class=en>Shipping:</t>
				<t class=ro>Transport:</t>
			</td>
			<td></td>
			<td align=right class="price nowrap">
				{{#shipping}}
					<t class=en>{{{shipping}}} RON</t>
					<t class=ro>{{{shipping}}} Lei</t>
				{{/shipping}}
				{{^shipping}}
					<t class=en>FREE SHIPPING</t>
					<t class=ro>GRATUIT</t>
				{{/shipping}}
			</td>
		</tr>
		<tr>
			<td align=right>
				Total:
			</td>
			<td></td>
			<td align=right class="price nowrap">
				<t class=en>{{{total}}} RON</t>
				<t class=ro>{{{total}}} Lei</t>
			</td>
		</tr>
		<tr>
			<td align=right colspan=3>
				<br>
				<button id=btn_checkout class=orange>
					<t class=en>Place Order</t>
					<t class=ro>Comanda</t>
				</button>
			</td>
		</tr>
		{{/buynow_count}}
	</table>
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
	<ul class=cart_list style="min-height: 100px">
	{{#.}}
		<li ciid={{{ciid}}}>
			<table width=100%>
				<tr>
					<td width=100 height=100>
						<a href="/p/{{{pid}}}/{{{coid}}}"><img src="/img/p/{{{imgid}}}-cart.jpg"></a>
					</td>
					<td>
						<a href="/p/{{{pid}}}/{{{coid}}}"><b>{{{bname}}}</b> {{{name}}}</a>
						<br>
						<span class=price>
							<t class=en>{{{price}}} RON</t>
							<t class=ro>{{{price}}} Lei</t>
						</span> {{{sname}}}
						<br>
						<a action=remove class=link><t class=en>Remove</t><t class=ro>Sterge</t></a>
						<span class="gray small">&nbsp;|&nbsp;</span>
						{{#buylater}}
							<a action=move_to_cart class=link>
								<t class=en>Move to cart</t>
								<t class=ro>Muta in cos</t>
							</a>
						{{/buylater}}
						{{^buylater}}
							<a action=buy_later class=link>
								<t class=en>Save for later</t>
								<t class=ro>Pastreaza pentru mai tarziu</t>
							</a>
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
	<h3>
		<t class=en>Enter account:</t>
		<t class=ro>Intra in cont:</t>
	</h3>
	<span class=help>
		<t class=en>
			Why register? Because this way you can keep the products you like
			in a list which you will find the next time you visit us.
		</t>
		<t class=ro>
			De ce sa te inregistrezi? Pentru ca asa iti poti pastra produsele
			care ti-au placut intr-o lista de preferinte, pe care o vei gasi si
			data viitoare cand ne vizitezi.
		</t>
	</span>
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
									placeholder:en="name@domain.com"
									placeholder:ro="nume@domeniu.com" required>
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
								<a title:en="See the password" title:ro="Vezi parola" class="fa fa-eye inside-right"></a>
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
								<a class="gray link" href="/forgot_password">
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
				<td width=20%>
					<label for=usr_email>Email:</label>
				</td>
				<td width=80%>
					<div class=errdiv1><div for=usr_email class="error errdiv2"></div></div>
					<input id=usr_email name=usr_email class=email type=text
						value="{{email}}"
						placeholder:en="name@domain.com"
						placeholder:ro="nume@domeniu.com"
						required>
				</td>
				<td rowspan=4 align=right valign=top width=60>
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
					<input id=usr_name name=usr_name type=text value="{{name}}"
						placeholder:en="Full Name" placeholder:ro="Nume Complet" required>
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
								<a id=relogin class="gray link">
									<t class=en>Not {{firstname}}?</t>
									<t class=ro>Nu esti {{firstname}}?</t>
								</a>
								{{/firstname}}
							</td>
							{{#show_operations}}
							<td align=right nowrap>
								{{#haspass}}
									<a href="/reset_password" class="gray link"><t class=en>Change password</t><t class=ro>Schimba parola</t></a> |
								{{/haspass}}
								<a id=logout class="gray link">
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
				<div ciid={{{ciid}}}>
					<table width=100%>
						<tr>
							<td width=15%>
								<a href="/p/{{{pid}}}/{{{coid}}}"><img src="/img/p/{{{imgid}}}-cart.jpg"></a>
							</td>
							<td>
								<a href="/p/{{{pid}}}/{{{coid}}}"><b>{{{bname}}}</b> {{{name}}}</a>
								<br>
								<span class=price>
									<t class=en>{{{price}}} RON</t>
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
						<t class=en>{{{subtotal}}} RON</t>
						<t class=ro>{{{subtotal}}} Lei</t>
					</span>
				</span>
				<br>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=checkout_template>

	<h1>
		<t class=en>Checkout</t>
		<t class=ro>Comanda</t>
	</h1>

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
						<!--
						<td>
							<input type=radio id=shipping_store name=shipping_method value=store>
						</td>
						<td>
							<label for=shipping_store>
								<t class=en>At your store</t>
								<t class=ro>Le ridic personal de la sediul shop-usa.ro, cu plata cash.</t>
							</label>
						</td>
						-->
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
					<t class=ro>Transport:</t>
					<span class=price>
						<t class=en><span class=shipping_cost></span> RON</t>
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
							<td width=20%>
								<label for=addr_street>
									<t class=en>Address:</t>
									<t class=ro>Adresa:</t>
								</label>
							</td>
							<td width=80%>
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
								<input id=addr_city name=addr_city type=text required>
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
								<input id=addr_county name=addr_county type=text required>
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
				<textarea id=order_note rows=6
					placeholder:en="Preferred hour, address details, etc."
					placeholder:ro="Ora preferata, detalii adresa, etc."></textarea>
			</td>
			<td valign=top class=gray>
				Ne poti lasa un mesaj sau poti contacta direct operatorii nostri.
			</td>
		</tr>

		<tr>
			<td>
				<table width=100%>
					<tr>
						<td valign=bottom>
							<img
								title:en="Order safely. Your connection is secured with SSL 128-bit"
								title:ro="Comanda in siguranta. Conexiunea ta este protejata prin SSL 128-bit"
								src="/ssl.png">
						</td>
						<td align=right>
							<br>
							<br>
							<span class=subtotal>Total:
								<span class=price>
									<t class=en><span class=grand_total></span> RON</t>
									<t class=ro><span class=grand_total></span> Lei</t>
								</span>
							</span>
							<br>
							<br>
							<button type=button id=btn_place_order class=orange>
								<t class=en>Place Order</t>
								<t class=ro>Plaseaza Comanda</t>
							</button>
						</td>
					</tr>
				</table>
			<td>
			</td>
		</tr>

	</table>
</script>

<script type="text/x-mustache" id=order_placed_template>
	<t class=en>
		<h1>Thank you for ordering from us!</h1>

		Your order will be processed shortly and we will call you for confirmation.
		<br>
		<br>
		Follow the status of the order in <a href="/account" class=link>your account</a>.
	</t>
	<t class=ro>
		<h1>Iti multumim ca ai comandat de la noi!</h1>

		In cel mai scurt timp, comanda ta va fi preluata de unul dintre
		operatorii nostrii si vei primi un telefon pentru confirmare.
		<br>
		<br>
		Urmareste starea comenzii in <a href="/account" class=link>contul tau</a>.
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
					<button class="slim orange" id=btn_send_email>
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
	<h1>
		<t class=en>Change password</t>
		<t class=ro>Schimba parola</t>
	</h1>
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
					<button class="slim orange" id=btn_reset_pass>
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
					<t class=en><a class=link href="/account">Back to account</a></t>
					<t class=ro><a class=link href="/account">Inapoi la cont</a></t>
					<br>
					<t class=en><a class=link href="/">Back to shopping</a></t>
					<t class=ro><a class=link href="/">Inapoi la cumparaturi</a></t>
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
	<t class=en><a class=link href="/account">Back to account</a></t>
	<t class=ro><a class=link href="/account">Inapoi la cont</a></t>
	<br>
	<t class=en><a class=link href="/">Back to shopping</a></t>
	<t class=ro><a class=link href="/">Inapoi la cumparaturi</a></t>
</script>

<script type="text/x-mustache" id=account_template>
	<h1>
		<t class=en>Account</t>
		<t class=ro>Contul meu</t>
	</h1>
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
				<h4>Comanda {{{oid}}} {{from_atime}}</h4>
				<table width=100%>
					{{#items}}
					<tr>
						<td>
							<div oiid={{{oiid}}}>
								<table width=100%>
									<tr>
										<td width=15%>
											<a href="/p/{{{pid}}}/{{{coid}}}"><img src="/img/p/{{{imgid}}}-cart.jpg"></a>
										</td>
										<td>
											<a><b>{{{bname}}}</b> {{{name}}}</a>
											<br>
											<span class=price>
												<t class=en>{{{price}}} RON</t>
												<t class=ro>{{{price}}} Lei</t>
											</span>
											{{{vnames}}}
											<br>
											<br>
										</td>
										<td align=right></td>
									</tr>
								</table>
							</div>
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
		<t class=en>There are no past orders.</t>
		<t class=ro>Nu ai facut inca nici o comanda.</t>
	</span>
	{{/orders}}
</script>

<script type="text/x-mustache" id=orderlist_page_template>
	<br>
	<table width=100%>
		<tr>
			<td class=nowrap>
				<b>
					<t class=en>Search:</t>
					<t class=ro>Cauta:</t>
				</b>
				&nbsp;
			</td>
			<td width=100%>
				<input type=text id=search
					placeholder:en="name, email, phone, product id, product name"
					placeholder:ro="nume, email, telefon, id produs, nume produs"
					value="{{q}}">
			</td>
		</tr>
	</table>
	<br>
	<div id=orders></div>
</script>

<script type="text/x-mustache" id=orderlist_template>
	<table width=100% class=datagrid>
		<tr>
			<th align=left><t class=en>order</t><t class=ro>comanda</t></th>
			<th align=left><t class=en>date</t><t class=ro>data</t></th>
			<th align=left>operator</th>
			<th align=left><t class=en>operator note</t><t class=ro>nota operator</t></th>
			<th align=left><t class=en>status</t><t class=ro>stare</t></th>
		</tr>
		{{#orders}}
		<tr oid={{{oid}}} class="{{{canceled}}} {{{open}}}">
			<td>{{{oid}}}</td>
			<td>{{atime}}</td>
			<td>{{opname}}</td>
			<td class=nowrap width=1>
				<div class=ellipsis style="width: 400px">{{opnote}}</div>
			</td>
			<td>{{status}}</td>
		</tr>
		{{/orders}}
	</table>
</script>

<script type="text/x-mustache" id=order_template>
	<br>
	<table width=100%>
		<tr>
			<td valign=top>
				<h3 style="margin: 0">
					<a href="/orders">
						<t class=en>Orders</t>
						<t class=ro>Comenzi</t>
					</a>
					&gt;
					<t class=en>Order {{oid}} from {{atime}}</t>
					<t class=ro>Comanda {{oid}} din {{atime}}</t>
				</h3>
				<h4 style="margin: 0">
					<t class=en>From {{uname}}, {{uphone}}</t>
					<t class=ro>De la {{uname}}, {{uphone}}</t>
				</h4>
			</td>
			<td align=right valign=top>
				<table width=200>
					<tr>
						<td>
							<b>
								<t class=en>status:</t>
								<t class=ro>stare</t>
							</b>
						</td>
						<td>
							<select id=status>
								{{#statuses}}
									<option value="{{value}}" {{{selected}}}>{{value}}</option>
								{{/statuses}}
							</select>
						</td>
					</tr>
					<tr>
						<td>
							<b>
								<t class=en>operator:</t>
								<t class=ro>operator:</t>
							</b>
						</td>
						<td><b>{{opname}}</b></td>
					</tr>
				</table>
			</td>
		</tr>
	</table>

	<h3>
		<t class=en>Items:</t>
		<t class=ro>Produse:</t>
	</h3>
	<table width=100% class=datagrid>
		<tr>
			<th align=left>pid</th>
			<th align=left><t class=en>product</t><t class=ro>produs</t></th>
			<th align=left><t class=en>combination</t><t class=ro>combinatie</t></th>
			<th align=right><t class=en>price</t><t class=ro>pret</t></th>
			<th align=left><t class=en>operator</t><t class=ro>operator</t></th>
			<th align=left><t class=en>note</t><t class=ro>nota</t></th>
			<th align=left><t class=en>status</t><t class=ro>stare</t></th>
		</tr>
		{{#items}}
		<tr oiid={{{oiid}}} class="{{{canceled}}}">
			<td><a href="http://6pm.com/{{{pid}}}" target=_blank>{{{pid}}}</a></td>
			<td width=1>
				<a href="/p/{{{pid}}}/{{{coid}}}"><div class=ellipsis style="width: 260px" title="{{{bname}}} {{{name}}}">{{{bname}}} {{{name}}}</div></a>
			</td>
			<td width=1>
				<div class=ellipsis style="width: 180px" title="{{{vnames}}}">{{{vnames}}}</div>
			</td>
			<td class=price align=right>
				<input type=text field=price class=price value="{{{price}}}"><span class=price>RON</span>
			</td>
			<td>{{item_opname}}</td>
			<td><input type=text field=note value="{{item_note}}"></td>
			<td width=100>
				<select field=status>
					{{#statuses}}
						<option value="{{{value}}}" {{{selected}}}>{{{value}}}</option>
					{{/statuses}}
				</select>
			</td>
		</tr>
		{{/items}}
		<!--
		<tr>
			<td width=76><input id=add_pid></td>
			<td colspan=5></td>
			<td><button type=button id=btn_add class="orange slim" style="width: 100%">
				<t class=en>Add</t>
				<t class=ro>Adauga</t>
			</button></td>
		</td>
		-->
		<tr>
			<td></td>
			<td></td>
			<td><b>Total: </b></td>
			<td class=price align=right>{{{total}}} RON</span>
			</td>
			<td colspan=3></td>
		</td>
	</table>

	<table width=100%>
		<tr>
			<td valign=top width=50%>
				<h3>Client:</h3>
				<table width=100% style="border-spacing: 5px;">
					<tr>
						<td>Email:</td>
						<td><input type=text id=email value="{{email}}"></td>
					</tr>
					<tr>
						<td>
							<t class=en>Name:</t>
							<t class=ro>Nume:</t>
						</td>
						<td>
							<input type=text id=name value="{{name}}">
						</td>
					</tr>
					<tr>
						<td>
							<t class=en>Phone:</t>
							<t class=ro>Telefon:</t>
						</td>
						<td>
							<input type=text id=phone value="{{phone}}">
						</td>
					</tr>
				</table>
			</td>
			<td valign=top width=50%>
				<table width=100%>
					<tr>
						<td>
							<h3>
								<t class=en>Shipping:</t>
								<t class=ro>Livrare:</t>
							</h3>
						</td>
						<td align=right>
							<select id=shiptype style="width: 100px">
							{{#shiptypes}}
								<option value="{{{value}}}" {{{selected}}}>{{{value}}}</option>
							{{/shiptypes}}
							</select>,
							<input type=text id=shipcost value="{{{shipcost}}}" class=price>
							<span class=price>RON</span>
						</td>
					</tr>
				</table>
				<div id=address_section>
					<table width=100% style="border-spacing: 5px;">
						<tr>
							<td>
								<t class=en>Address:</t>
								<t class=ro>Adresa:</t>
							</td>
							<td>
								<input type=text id=addr value="{{addr}}">
							</td>
						</tr>
						<tr>
							<td>
								<t class=en>City:</t>
								<t class=ro>Oras:</t>
							</td>
							<td>
								<input type=text id=city value="{{city}}">
							</td>
						</tr>
						<tr>
							<td>
								<t class=en>County:</t>
								<t class=ro>Judet:</t>
							</td>
							<td>
								<input type=text id=county value="{{county}}">
							</td>
						</tr>
					</table>
				</div>
			</td>
		</tr>
		<tr>
			<td valign=top>
				<h3>
					<t class=en>Customer Note:</t>
					<t class=ro>Nota Client:</t>
				</h3>
				<textarea id=note rows=4>{{note}}</textarea>
			</td>
			<td valign=top>
				<h3>
					<t class=en>Operator Note:</t>
					<t class=ro>Nota Operator:</t>
				</h3>
				<textarea id=opnote rows=4>{{opnote}}</textarea>
			</tD>
		</tr>
	</table>

	<br>
	<br>
	<div style="float:right">
		<button id=btn_save type=button class=orange>
			<t class=en>Save Changes</t>
			<t class=ro>Salveaza</t>
		</button>
	</div>
	<br>
	<br>
	<br>
	<br>

</script>

<script type="text/x-mustache" id=contact_template>
	<h1>
		<t class=en>Contact Us</t>
		<t class=ro>Contacteaza-ne</t>
	</h1>
	<table width=100%>
		<tr>
			<td valign=top width=50%>
				<h3>
					<t class=en>Address:</t>
					<t class=ro>Adresa:</t>
				</h3>
				<t class=en>
					Atena street, no. 4<br>
					Bucharest, Sector 1
				</t>
				<t class=ro>
					str. Atena nr. 4<br>
					Bucuresti, Sector 1
				</t>

				<h3>
					<t class=en>Email:</t>
					<t class=ro>Email:</t>
				</h3>
				<a href="mailto:comenzi@shop-usa.ro">comenzi@shop-usa.ro</a>

				<h3>
					<t class=en>Phone:</t>
					<t class=ro>Telefon:</t>
				</h3>
				0745 577 786

				<h3>
					<t class=en>Opening hours:</t>
					<t class=ro>Program:</t>
				</h3>
				<t class=en>Monday to Friday, between 10-17</t>
				<t class=ro>Luni-Vineri, intre orele 10-17</t>
			</td>
			<td valign=top>
				<iframe width="450" height="450" frameborder="0" style="border:0"
					src="https://www.google.com/maps/embed/v1/place?q=str%20Atena%20nr%204%20Bucuresti&key=AIzaSyBWOoJutPpIR1jCYXxILQkX0o5hNYrSSu8&zoom=15"></iframe>
			</td>
		</tr>
	</table>
</script>

<script type="text/x-mustache" id=faq_template>
	<h1>
		<t class=en>F.A.Q.</t>
		<t class=ro>Intrebari frecvente</t>
	</h1>
	<t class=ro>
	<h3></h3>

	</t>
</script>

<script type="text/x-mustache" id=about_template>
	<h1>
		<t class=en>About us</t>
		<t class=ro>Despre Noi</t>
	</h1>
	<t class=en></t>
	<t class=ro>
	In fiecare zi inspiram clientii nostri sa gaseasca cel mai bun raspuns la
	intrebarea: "Ce voi purta eu astazi?" sau cu alte cuvinte
	"Cine voi fi eu astazi?". Reusim acest lucru in stilul SHOP-USA prin a
	oferi o gama larga de peste <b>100 000 de produse</b>, de la mai mult de
	<b>1000 de 	branduri</b> de piese vestimentare, incaltaminte si accesorii
	pentru femei, barbati si copii, precum si o doza zilnica de inspiratie.
	<br>
	<br>
	SHOP-USA este un magain online de haine, incaltaminte si accesorii pentru
	toata familia.
	</t>
</script>

<script type="text/x-mustache" id=howto_template>
	<h1>
		<t class=en>How to Order</t>
		<t class=ro>Cum Comand</t>
	</h1>
	<t class=en></t>
	<t class=ro>
	Produsul pe care doresti sa il comanzi poate fi gasit fie prin utilizarea
	meniului din partea de sus a paginii ce contine categoriile de produse,
	prin folosirea campului de cautare, sau direct din pagina de promotii.
	<br>
	<br>
	La apasarea butonului "ADAUGA IN COS", produsul va fi automat transferat
	in cosul de cumparaturi.
	<br>
	<br>
	Dupa adaugarea in cos a tuturor produselor pe care doresti sa le comanzi,
	procesul de cumparare continua prin apasarea butonului "COMANDA".
	<br>
	<br>
	In pagina de comanda va trebui sa completezi informatiile necesare
	trimiterii coletului. Comanda se va finaliza prin apasarea butonului
	"PLASEAZA COMANDA" in urma careia vei primi un email de confirmare,
	iar comanda ta va fi preluata in cel mai scurt timp de unul dintre
	operatorii nostri.
	</t>
</script>

<script type="text/x-mustache" id=refund_template>
	<h1>
		<t class=en>Refund policy</t>
		<t class=ro>Politica de returnare</t>
	</h1>
	<t class=en></t>
	<t class=ro>
		<h3>Cum procedez daca trebuie sa returnez un produs?</h3>
		In situatia in care produsele comandate nu sunt conform cu
		specificatiile de pe site sau produsele au fost livrate gresit, le
		puteti returna intr-un interval de <b>14 zile lucratoare</b> si veti
		primi integral valoarea produsului inapoi.
		<br>
		<br>
		ATENTIE! Produsele trebuie sa fie noi, in conditiile in care le-ati
		primit, in ambalajele/pachetele originale, fara urma de uzura sau
		deteriorare.
		<br>
		<br>
		Va rugam sa va asigurati ca produsele sunt in <b>ambalajele originale</b>
		si in conditiile in care le-ati primit (cutia originala de pantofi, cu
		<b>etichetele intacte</b> si impreuna cu toate <b>documentele</b> ce
		v-au fost livrate). Sigilati produsele pe care doriti sa le returnati
		intr-o punga sau o cutie.
		Produsele care au lipite pe ambalajul original, etichete de la curier,
		banda adeziva sau orice alt material ce va deteriora produsul (cutie,
		ambalaj, etc.) nu vor fi acceptate ca retur.
	</t>
</script>

<script type="text/x-mustache" id=tos_template>
	<h1>
		<t class=en>Terms of service</t>
		<t class=ro>Termeni si conditii</t>
	</h1>

	<h3>
		<t class=en>Delivery and payment</t>
		<t class=ro>Conditii de livrare si plata</t>
	</h3>
	<t class=en></t>
	<t class=ro>
	Comenzile vor fi onorate in cel mai scurt timp posibil. Produsele se
	livreaza <b>in limita stocului</b> disponibil. Situatia stocului de pe site nu
	este actualizata in timp real, astfel incit in anumite situatii se poate
	intimpla ca stocul la anumite produse din comanda sa se fi epuizat.
	In astfel de cazuri vei fi notificat prin email sau telefon si ti se va
	cere, fie sa renunti la acel produs, fie sa alegi un alt produs.
	</t>

	<h3>
		<t class=en>Delivery</t>
		<t class=ro>Transportul</t>
	</h3>
	<t class=en></t>
	<t class=ro>
	Coletele vor fi transportate si livrate de catre <b>Urgent Curier</b>.
	Livrarea  se face <b>oriunde in tara</b> in <b>24-48 ore</b>, intre orele
	<b>8-19:30 de luni pana vineri</b> si <b>sambata intre orele 9-14:00</b>
	iar coletul ti se va inmana personal. In cazul in care nu esti disponibil(a)
	in acest interval orar, te rugam sa specifici o alta adresa (de exemplu,
	adresa de la serviciu).
	In ziua in care coletul este expediat vei primi un sms pe telefonul
	indicat de tine pentru a anunta livrarea.
	<br>
	<br>
	Pentru comenzi de minim <b>300 RON (inclusiv)</b> transportul este <b>GRATUIT</b>.
	</t>
</script>

<script type="text/x-mustache" id=confidentiality_template>
	<h1>
		<t class=en>Confidentiality</t>
		<t class=ro>Confidentialitate</t>
	</h1>
	<t class=en></t>
	<t class=ro>
	Conform cerintelor Legii nr. 677/2001 pentru protectia persoanelor cu
	privire la prelucrarea datelor cu caracter personal si libera circulatie
	a acestor date, modificata si completata si ale Legii nr. 506/2004 privind
	prelucrarea datelor cu caracter personal si protectia vietii private in
	sectorul comunicatiilor electronice, SHOP-USA are obligatia de a administra
	in conditii de siguranta si numai pentru scopurile specificate, datele
	personale pe care ni le furnizati despre dumneavoastra, un membru al
	familiei dumneavoastra ori o alta persoana.
	<br>
	<br>
	Scopul colectarii si prelucrarii datelor este onorarea comenzilor
	dumneavoastra. Aceste date <b>nu vor fi date spre publicare si nici unor
	terte persoane</b>. Dumneavoastra <b>nu veti primi mesaje publicitare</b>
	sau mesaje informative generale prin posta electronica decat dupa ce va
	dati acceptul in acest sens. Exceptie fac mesajele prin care va notificam
	asupra comenzilor dumneavoastra (confirmari s.a.).
	<br>
	<br>
	Conform Legii nr. 677/2001, beneficiati de dreptul de acces, de interventie
	asupra datelor, dreptul de a nu fi supus unei decizii individuale si
	dreptul de a va adresa justitiei. Totodata, aveti dreptul sa va opuneti
	prelucrarii datelor personale care va privesc si sa solicitati stergerea
	datelor.
	<br>
	<br>
	Daca unele din datele despre dumneavoastra sunt incorecte, va rugam sa ne
	informati cat mai curand posibil si sa modificati aceste date in contul
	dumneavoastra de utilizator de pe acest site.
	</t>
</script>

<script type="text/x-mustache" id=not_found_template>
	<h1>
		<t class=en>Page not found</t>
		<t class=ro>Pagina inexistenta</t>
	</h1>
	<t class=en>
	We couldn't find the page you were looking for.
	</t>
	<t class=ro>
	Nu am gasit pagina pe care o cauti.
	</t>
</script>

<div id=fb-root class=hidden></div>
</body>
</html>
