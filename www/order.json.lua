
allow(admin())

local oid = assert((...))

local items = check(query([[
	select
		i.oiid, i.coid, i.qty, i.price,
		i.note, i.status, i.atime, i.mtime,
		p.id_product as pid,
		pl.name,
		group_concat(distinct al.name separator ', ') as vnames,
		m.name as bname,
		im.id_image as imgid
	from
		ordritem i
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
			on im.id_image = pai.id_image
	where
		i.oid = ?
	group by
		i.oiid
]], oid))

--[[
for i,ci in groupby(order, 'ciid') do
	local t = ci[1]
	local combi = {
		ciid = t.ciid, coid = t.coid, pid = t.pid,
		name = t.name, price = t.price,  old_price = t.old_price,
		bname = t.bname, vids = {}, vnames = {}, imgid = t.imgid, imgs = {},
		atime_ago = tonumber(t.atime_ago),
	}
	table.insert(items, combi)
	for i,t in groupby(ci, 'vid') do
		table.insert(combi.vids, t[1].vid)
		table.insert(combi.vnames, t[1].vname)
		for i,e in ipairs(t) do
			table.insert(combi.imgs, tonumber(e.imgid))
		end
	end
end
]]

out(json({items = items}))
