
local catid, page, pagesize = ...
catid = check(uint_arg(catid))
page  = tonumber(page) or 1
pagesize = clamp(tonumber(pagesize) or 99, 1, 99)

local offset = (page - 1) * pagesize

local pcount = check(query1([[
	select product_count as pcount from ps_category
	where id_category = ?
]], catid)).pcount

local pagecount = math.ceil(pcount / pagesize)

local products = query([[
	select
		p.id_product as pid,
		pl.name,
		p.price,
		i.id_image as imgid,
		m.name as bname
	from
		ps_product p
	left join ps_image i on
		i.id_product = p.id_product
		and i.cover = 1
	inner join ps_product_shop ps on
		ps.id_product = p.id_product
		and ps.id_shop = 1
	inner join ps_category_product cp on
		cp.id_product = p.id_product
		and cp.id_category = ?
	inner join ps_product_lang pl on
		pl.id_product = p.id_product
	left join ps_manufacturer m on
		m.id_manufacturer = p.id_manufacturer
	where
		p.active = 1
	limit
]]..offset..', '..pagesize, catid)

local function update_default_price()
	query[[
		update ps_product p set p.price = (
			select pa.price from ps_product_attribute pa
			where pa.id_product = p.id_product and pa.default_on = 1)
	]]
end

out_json(products)
