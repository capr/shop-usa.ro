
local action = ...

local function out_summary()
	local count = query1([[
		select count(1) from cartitem where cartid = ? and buylater = 0
	]], cartid())
	out_json({
		cartid = cartid(),
		count = tonumber(count),
	})
end

if action == 'summary' then
	out_summary()
	return
end

if POST then
	local data = json(POST.data)
	check(data.cartid == cartid())
	if action == 'add' then
		query([[
			insert into cartitem
				(cartid, pid, coid, qty, pos, buylater)
			values
				(?, ?, ?, 1, ?, ?)
		]], cartid(), data.pid, data.coid, data.pos or 0, data.buylater or 0)
		out_summary()
		return
	elseif action == 'reorder' then
		for i,ciid in ipairs(data.ciids) do
			query([[
				update cartitem
				set pos = ?
				where ciid = ? and cartid = ?
			]], i, ciid, cartid())
		end
	elseif action == 'remove' then
		query('delete from cartitem where ciid = ? and cartid = ?',
			data.ciid, cartid())
	elseif action == 'move_to_cart' then
		query('update cartitem set buylater = 0 where ciid = ? and cartid = ?',
			data.ciid, cartid())
	elseif action == 'buy_later' then
		query('update cartitem set buylater = 1 where ciid = ? and cartid = ?',
			data.ciid, cartid())
	end
end

local t = query([[
	select
		ci.cartid,
		ci.ciid,
		ci.coid,
		p.id_product as pid,
		a.id_attribute as vid,
		al.name as vname,
		pl.name,
		coalesce(pa.price, p.price) as price,
		pa.old_price as old_price,
		m.name as bname,
		i.id_image as imgid,
		ci.buylater
	from
		cartitem ci
	inner join ps_product p
		on p.id_product = ci.pid
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
	left join ps_attribute_lang al
		on al.id_attribute = a.id_attribute
	left join ps_product_attribute_image pai
		on pai.id_product_attribute = pa.id_product_attribute
	left join ps_image i
		on i.id_image = pai.id_image
	where
		ci.cartid = ?
		and p.active = 1
	order by
		ci.buylater,
		ci.pos, ci.atime,
		a.position, a.id_attribute,
		i.position, i.id_image
]], cartid())

local cjson = require'cjson'
local cart = {cartid = cartid(), buy_now = {}, buy_later = {}}
for i,grp in groupby(t, 'buylater') do
	local items = grp[1].buylater == 1 and cart.buy_later or cart.buy_now
	for i,ci in groupby(grp, 'ciid') do
		local t = ci[1]
		local combi = {
			buylater = t.buylater == 1,
			ciid = t.ciid, coid = t.coid, pid = t.pid,
			name = t.name, price = t.price,  old_price = t.old_price,
			bname = t.bname, vids = {}, vnames = {}, imgid = t.imgid, imgs = {},
		}
		table.insert(items, combi)
		for i,t in groupby(ci, 'vid') do
			table.insert(combi.vids, t[1].vid)
			table.insert(combi.vnames, t[1].vname)
			for i,e in ipairs(t) do
				table.insert(combi.imgs, tonumber(e.imgid))
			end
		end
	end
end

out_json(cart)
