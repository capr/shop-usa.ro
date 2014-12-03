
allow(admin())

local orders = query([[
	select
		o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
		o.note, o.shiptype, o.shipcost, o.status, o.atime, o.mtime,
		o.note, o.uid,
		o.opnote,
		u.name as opname,
		u.email as opemail,
		if(field(o.status, 'shipped', 'canceled', 'returned') = 0, 1, 0) as open
	from
		ordr o
		left join usr u on u.uid = o.opuid
	order by
		open,
		o.mtime desc
	]])

for i,o in ipairs(orders) do
	o.open = tonumber(o.open) == 1
end

out(json{orders = orders})
