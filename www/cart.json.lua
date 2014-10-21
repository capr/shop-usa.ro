
local action = {}

function action.show()
	local cart = json(cookie'cart' or {})
	pp(cart)
	local items = {}
	for i,item in ipairs(cart) do
		local pid, coid = item.k:match'(%d+) (%d+)'
		local t = query1([[
			select
				pl.name,
				pa.price,
				m.name as bname
			from
				ps_product p
			inner join ps_product_lang pl on
				pl.id_product = p.id_product
				and pl.id_lang = 1
			left join ps_manufacturer m on
				m.id_manufacturer = p.id_manufacturer
			inner join ps_product_attribute pa on
				pa.id_product = p.id_product
			left join ps_product_attribute_image pai on
				pai.id_product_attribute = pa.id_product_attribute
			where
				p.active = 1
				and p.id_product = ?
				and pa.id_product_attribute = ?
		]], pid, coid)
		t.k = item.k
		t.n = item.n
		table.insert(items, t)
	end
	out_json(items)
end

action = action[(...)] or action.show
action(select(2, ...))
