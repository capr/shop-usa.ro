
local catid = ...
catid = assert(uint_arg(catid))

local dims = {}
for i,t in groupby(query([[
	select
		agl.id_attribute_group as did,
		agl.name dname,
		al.id_attribute as dvid,
		al.name as dvname,
		count(1) as count
	from ps_category_product cp
	inner join ps_product_attribute pa
		on pa.id_product = cp.id_product
	inner join ps_product_attribute_combination pac
		on pac.id_product_attribute = pa.id_product_attribute
	inner join ps_product p
		on p.id_product = cp.id_product
		and p.active = 1
	inner join ps_attribute a
		on a.id_attribute = pac.id_attribute
	inner join ps_attribute_lang al
		on al.id_attribute = pac.id_attribute
		and al.id_lang = 1
	inner join ps_attribute_group_lang agl
		on agl.id_attribute_group = a.id_attribute_group
		and agl.id_lang = 1
	where
		cp.id_category = ?
		and agl.id_attribute_group <> 1716930793
	group by
		agl.id_attribute_group,
		al.id_attribute
]], catid), 'did') do
	local did = t[1].did
	local dim = {dname = t[1].dname, values = {}}
	table.insert(dims, dim)
	for i,t in ipairs(t) do
		table.insert(dim.values, {t.dvid, t.dvname, tonumber(t.count)})
	end
end

out(json(dims))
