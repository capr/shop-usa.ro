
local orders = {}

for i,o in groupby(query([[
	select
		o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
		o.note, o.shiptype, o.shipcost, o.atime, o.mtime,
		i.oiid, i.coid, i.qty, i.price, i.atime as iatime, i.mtime as imtime
	from
		ordr o
		inner join ordritem i
			on i.oid = o.oid
	where
		o.uid = ?
	order by
		o.mtime desc
	]], uid()), 'oid') do

	local t = o[1]
	local order = {
		oid = t.oid, email = t.email, name = t.name, phone = t.phone,
		addr = t.addr, city = t.city, county = t.county, country = t.country,
		note = t.note, shiptype = t.shiptype, shipcost = t.shipcost,
		atime = t.atime, mtime = t.mtime,
		items = {},
	}
	table.insert(orders, order)
	for i,t in ipairs(o) do
		order.items[i] = {
			oiid = t.oiid, coid = t.coid, qty = t.qty, price = t.price,
			atime = t.iatime, mtime = t.imtime,
		}
	end
end

out(json({orders = orders}))
