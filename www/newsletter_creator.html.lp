<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Newsletter Creator - SHOP USA</title>
	<link rel="stylesheet" type="text/css" href="/all.css">
	<script src="/all.js"></script>
</head>
<body>
<%

local path = table.concat({...}, '/')
local params = ngx.encode_args(glue.update({partial=true}, GET))

local pids = {}
for i = 1, 12 do
	table.insert(pids, tonumber(GET['i'..i]))
end

local sql = [[
	select
		p.id_product as pid,
		pl.name,
		$ronprice(p.price, ]] .. quote(usd_rate()) .. [[) as price,
		$ronprice(p.msrp, ]] .. quote(usd_rate()) .. [[) as msrp,
		p.discount,
		i.id_image as imgid,
		m.name as bname
	from
		ps_product p
	left join ps_image i on
		i.id_product = p.id_product
		and i.cover = 1
	left join ps_product_lang pl on
		pl.id_product = p.id_product
		and pl.id_lang = 1
	left join ps_manufacturer m on
		m.id_manufacturer = p.id_manufacturer
	where
		p.id_product in (]] .. table.concat(pids, ', ') .. [[)
	group by
		p.id_product
]]

local prods = #pids > 0 and query(sql) or {}

%>

<% if not GET.partial then %>
	<table width=100%>
		<tr>
			<td colspan=2>
				<input value="<%=home_url('/newsletter-creator.html/'..path..'?'..params)%>">
			</td>
		</tr>
		<tr>
			<td width=100>
				<form>
				<% for i = 1, 12 do %>
				<input name="i<%=i%>" value="<%=GET['i'..i] or ''%>">
				<% end %>
				<button type=submit class=orange style="width: 100%">Modifica</button>
				</form>
			</td>
			<td valign=top align=left>
				<div style="margin: 20px; border: 1px solid #ccc">
				<% end %>

				<table>
				<% local n = 0; for i = 1, 3 do %>
					<tr>
					<% for j = 1, 4 do %>
						<td width=200>
						<%
							n = n + 1
							local prod = prods[n]
							if prod then
								out(render('newsletter_creator_item', prod))
							end
						%>
						</td>
					<% end %>
				<% end %>
				</table>

				<% if not GET.partial then %>
				</div>
			</td>
		</tr>
	</table>
<% end %>
</body>
</html>
