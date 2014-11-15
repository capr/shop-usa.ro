
if POST then
	local action = ...
	local data = json(POST.data)
	check(data.cartid == cartid())
	if action == 'reorder' then
		for i,ciid in ipairs(data) do
			query([[
				update cartitem
				set pos = ?
				where ciid = ?
			]], i, ciid)
		end
	elseif action == 'add' then
		query([[
			insert into cartitem
				(cartid, pid, coid, pos, buylater)
			values
				(?, ?, ?, ?, ?)
		]], cartid(), data.pid, data.coid, data.pos, data.buylater)
	elseif action == 'remove' then
		query('remove from cartitem where ciid = ?', data.ciid)
	end
end

local t = query([[
	select
		ci.ciid,
		ci.coid,
		p.id_product as pid,
		a.id_attribute as vid,
		pl.name,
		pa.price or p.price as price,
		pa.old_price or p.old_price as old_price,
		m.name as bname,
		i.id_image as imgid,
		ci.buylater
	from
		cartitem ci
	inner join ps_product p
		on p.id_product = ci.id_product
	inner join ps_product_lang pl
		on pl.id_product = p.id_product and pl.id_lang = 1
	left join ps_manufacturer m
		on m.id_manufacturer = p.id_manufacturer
	left join ps_product_attribute pa
		on pa.id_product_attribute = ci.coid
	left join ps_product_attribute_combination pac
		on pac.id_product_attribute = pa.id_product_attribute
	left join ps_attribute a
		on a.id_attribute = pac.id_attribute
	left join ps_product_attribute_image pai
		on pai.id_product_attribute = pa.id_product_attribute
	left join ps_image i
		on i.id_image = pai.id_image
	where
		ci.cartid = ?
		and p.active = 1
	order by
		ci.buylater,
		ci.pos, ci.coid,
		a.position, a.id_attribute,
		i.position, i.id_image
]], cartid())

local carts = {}
for i,t in groupby(t, 'buylater') do
	local cart = {buylater = t[1].buylater}
	table.insert(carts, cart)
	for i,t in groupby(t, 'coid') do
		local combi = {
			ciid = t[1].ciid, coid = t[1].coid, pid = t[1].pid,
			name = t[1].name, price = t[1].price, bname = t[1].bname,
			attrs = {}, imgs = {},
		}
		table.insert(cart, combi)
		for i,t in groupby(t, 'vid')
			table.insert(combi.attrs, t[1].vid)
			for i,e in ipairs(t) do
				table.insert(combi.imgs, tonumber(e.imgid))
			end
		end
	end
end

out_json(carts)

