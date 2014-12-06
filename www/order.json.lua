
allow(admin())

local oid, action = ...
assert(oid)

if POST then
	if action == 'add' then
		local d = json(POST.data)
		local coid = assert(d.coid)
		query([[
			insert into ordritem
				(qty, status, coid, mtime, oid, price)
			select
				 1, 'new', pa.id_product_attribute, now(), ?, $ronprice(pa.price, ?)
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
				str_arg(o.shipcost), str_arg(o.status), uid(), str_arg(o.opnote),
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
							mtime = now(), opuid = ?
						where
							oiid = ?
						]], uid(), oiid)
				end
			end
	else
		error'invalid action'
	end
end

local order = query1([[
	select
		o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
		o.note, o.shiptype, o.shipcost, o.status, o.atime, o.mtime,
		o.note, o.uid,
		o.opnote,
		u.name as uname,
		u.email as uemail,
		u.phone as uphone,
		opu.name as opname,
		opu.email as opemail
	from
		ordr o
		inner join usr u on u.uid = o.uid
		left join usr opu on opu.uid = o.opuid
	where
		o.oid = ?
	]], oid)


order.items = check(query([[
	select
		i.oiid, i.coid, i.qty, i.price,
		i.note as item_note,
		i.status as status,
		opu.name as opname,
		opu.email as opemail,
		p.id_product as pid,
		pl.name,
		group_concat(distinct al.name separator ', ') as vnames,
		m.name as bname,
		im.id_image as imgid
	from
		ordritem i
		left join usr opu
			on opu.uid = i.opuid
		inner join ps_product_attribute pa
			on pa.id_product_attribute = i.coid
		inner join ps_product p
			on p.id_product = pa.id_product
		inner join ps_product_lang pl
			on pl.id_product = p.id_product and pl.id_lang = 1
		left join ps_manufacturer m
			on m.id_manufacturer = p.id_manufacturer
		inner join ps_product_attribute_combination pac
			on pac.id_product_attribute = pa.id_product_attribute
		inner join ps_attribute a
			on a.id_attribute = pac.id_attribute
		inner join ps_attribute_lang al
			on al.id_attribute = a.id_attribute
		left join ps_product_attribute_image pai
			on pai.id_product_attribute = pa.id_product_attribute
		left join ps_image im
			on im.id_image = pai.id_image and im.cover = 1
	where
		i.oid = ?
	group by
		i.oiid
]], oid))

out(json(order))
