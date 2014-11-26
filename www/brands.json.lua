
local search, catid = ...
catid = uint_arg(catid) or 2

local cond
if search == 'other' then
	cond = 'm.name regexp \'^[^a-zA-Z]\''
elseif not search or search == 'all' then
	cond = 'm.name like \'%\''
elseif search and #search == 1 then
	cond = 'm.name like \'' .. search .. '%\''
end

local brands = query([[
	select
		m.id_manufacturer as bid,
		m.name as bname,
		count(1) as pcount
	from
		ps_manufacturer m
		inner join ps_product p on
			p.id_manufacturer = m.id_manufacturer
		inner join ps_category_product cp on
			cp.id_product = p.id_product
			and cp.id_category = ?
	where
		]] .. cond .. [[
		and m.active = 1
	group by
		m.id_manufacturer
	order by
		m.name
]], catid)

out(json{ brands = brands })

