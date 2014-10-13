
local catid, page = ...
catid = assert(id_arg(catid))
page  = tonumber(page) or 1

local pagesize = 100
local offset = (page - 1) * pagesize
--local pagecount = math.ceil(active_node.count / pagesize)

local products = query([[
	select
		p.id_product as pid,
		pl.name,
		ps.price,
		i.id_image as imgid
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
	where
		p.active = 1
	limit
]]..offset..', '..pagesize, catid)

out_json(products)
