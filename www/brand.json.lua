require'cat'

local bid = ...
bid = check(tonumber(bid))

local brand = query1([[
	select
		m.id_manufacturer as bid,
		m.name as bname
	from
		ps_manufacturer m
	where
		m.id_manufacturer = ?
]], bid)

local cats = query([[
	select
		c.id_category as id,
		c.id_parent as pid,
		c.is_root_category as root,
		cl.name,
		count(1) as count,
		c.active
	from
		ps_category c
	inner join
		ps_category_lang cl on
			cl.id_category = c.id_category
	inner join ps_category_product cp on
		cp.id_category = c.id_category
	inner join ps_product p on
		p.id_product = cp.id_product
	inner join ps_manufacturer m on
		m.id_manufacturer = p.id_manufacturer
		and m.id_manufacturer = ?
	where
		c.active = 1
	group by
		c.id_category
	order by
		c.id_parent,
		c.position
]], bid)

brand.cats = make_cat_tree(cats)

out(json(brand))

