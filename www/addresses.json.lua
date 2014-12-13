
local addr = query([[
	select
		o.addr,
		o.city,
		o.county,
		o.country
	from
		ordr o
	where
		o.uid = ?
	order by
		o.atime desc
]], uid())

out(json({addr = addr}))
