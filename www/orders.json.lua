
local orders = {}

for i,oi in groupby(query([[
	select
		o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
		o.note, o.shiptype, o.shipcost, o.atime, o.mtime,
		i.oiid, i.coid, i.qty, i.price, i.atime as iatime, i.mtime as imtime,
		p.id_product as pid,
		al.name as vname,
		pl.name,
		m.name as bname,
		i.id_image as imgid
	from
		ordr o
		inner join ordritem i
			on i.oid = o.oid
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
		o.uid = ?
	order by
		o.mtime desc
	]], uid()), 'oid') do

	local o = oi[1]

	local order = {
		oid = o.oid, email = o.email, name = o.name, phone = o.phone,
		addr = o.addr, city = o.city, county = o.county, country = o.country,
		note = o.note, shiptype = o.shiptype, shipcost = o.shipcost,
		atime = o.atime, mtime = o.mtime,
		items = {},
	}
	table.insert(orders, order)

	for i,t in ipairs(oi) do
		order.items[i] = {
			oiid = t.oiid, coid = t.coid, qty = t.qty, price = t.price,
			atime = t.iatime, mtime = t.imtime,
		}
	end
end

out(json({orders = orders}))
