
local catid, page, bid, pagesize = ...
catid = check(uint_arg(catid))
page  = tonumber(page) or 1
pagesize = clamp(tonumber(pagesize) or 99, 1, 99)
bid = tonumber(bid)

local offset = (page - 1) * pagesize

local prod_count

if bid then
	prod_count = query1([[
		select
			count(1)
		from
			ps_product p
		inner join ps_category_product cp on
			cp.id_product = p.id_product
			and cp.id_category = ?
		where
			p.active = 1
]] .. (bid and ('and p.id_manufacturer = '..quote(bid)) or '') .. [[
]], catid)
else
	prod_count = query1([[
		select
			c.product_count
		from
			ps_category c
		where
			c.id_category = ?
	]], catid)
end

--note: "newest first" is actually "oldest first".
local prods = query([[
	select
		p.id_product as pid,
		pl.name,
		$ronprice(p.price, ?) as price,
		$ronprice(p.msrp, ?) as msrp,
		p.discount,
		i.id_image as imgid,
		m.name as bname
	from
		ps_product p
	left join ps_image i on
		i.id_product = p.id_product
		and i.cover = 1
	inner join ps_category_product cp on
		cp.id_product = p.id_product
		and cp.id_category = ?
	inner join ps_product_lang pl on
		pl.id_product = p.id_product
		and pl.id_lang = 1
	left join ps_manufacturer m on
		m.id_manufacturer = p.id_manufacturer
	where
		p.active = 1
]] .. (bid and ('and p.id_manufacturer = '..quote(bid)) or '') .. [[
	order by
		p.date_upd
	limit
]]..offset..', '..pagesize, usd_rate(), usd_rate(), catid)


out(json({
	prods = prods,
	prod_count = prod_count,
}))
