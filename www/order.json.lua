
allow(admin())

local oid, action = ...
assert(oid)

if POST then
	if action == 'add' then

		local d = json(POST.data)
		local coid = assert(d.coid)

		query([[
			insert into ordritem
				(qty, status, coid, ctime, mtime, oid, price)
			select
				 1, 'new', pa.id_product_attribute, now(), now(), ?, $ronprice(pa.price, ?)
			from
				ps_product_attribute pa
			where
				pa.id_product_attribute = ?
			]], oid, usd_rate(), coid)

		query('update ordr set opuid = ? where oid = ?', uid(), oid)

	elseif action == 'update' then

		local o = json(POST.data)

		query([[
			update ordr set
				email = ?,
				name = ?,
				phone = ?,
				addr = ?,
				city = ?,
				county = ?,
				country = ?,
				note = ?,
				shiptype = ?,
				shipcost = ?,
				discount = ?,
				status = ?,
				opuid = ?,
				opnote = ?,
				mtime = now()
			where
				oid = ?
			]],
				str_arg(o.email), str_arg(o.name), str_arg(o.phone),
				str_arg(o.addr), str_arg(o.city), str_arg(o.county),
				str_arg(o.country), str_arg(o.note), str_arg(o.shiptype),
				str_arg(o.shipcost), str_arg(o.discount),
				str_arg(o.status), uid(), str_arg(o.opnote),
				oid)

		for i,oi in ipairs(o.items) do

			if changed(query([[
				update ordritem set
					price = ?,
					note = ?,
					status = ?
				where
					oiid = ?
			]], str_arg(oi.price), str_arg(oi.note), str_arg(oi.status),
				oi.oiid))
			then

				query([[
					update ordritem set
						mtime = now(),
						opuid = ?
					where
						oiid = ?
					]], uid(), oi.oiid)
			end
		end

	else
		error'invalid action'
	end
end

local order = require'order'.get(oid)
out(json(order))
