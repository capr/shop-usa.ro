
allow(admin())

local orders = query([[
	select
		o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
		o.note, o.shiptype, o.shipcost, o.status, o.atime, o.mtime,
		o.note, o.uid,
		o.opnote,
		coalesce(u.name, u.email) as opname
	from
		ordr o
		left join usr u on u.uid = o.opuid
	order by
		o.mtime desc
	]])

out(json({orders = orders}))
