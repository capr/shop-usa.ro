require'_cat'

local cats = query[[
	select
		c.id_category as id,
		c.id_parent as pid,
		c.is_root_category as root,
		cl.name,
		c.product_count as count
	from
		ps_category c
	inner join
		ps_category_lang cl on
			cl.id_category = c.id_category
	where
		c.active = 1
	order by
		c.id_parent,
		c.position
]]

local cats = make_cat_tree(cats)
out_json(cats)

