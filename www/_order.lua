setfenv(1, require'g')

local function get(oid)
	local order = query1([[
		select
			o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
			o.note, o.shiptype, o.shipcost, o.discount,
			o.status, o.ctime, o.mtime,
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

	return order
end

return {
	get = get,
}

