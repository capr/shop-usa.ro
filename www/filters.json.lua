
local catid = ...
catid = assert(uint_arg(catid))

query([[
	select
		agl.id_attribute_group as did,
		agl.name dname,
		al.id_attribute as dvid,
		al.name as dvname
	from ps_category_product cp
	inner join ps_product_attribute pa
		on pa.id_product = cp.id_product
	inner join ps_product_attribute_combination pac
		on pac.id_product_attribute = pa.id_product_attribute
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
	group by
		agl.id_attribute_group,
		al.id_attribute
]], catid)
