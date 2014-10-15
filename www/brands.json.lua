
local search = ...

local cond
if search == '0-9' then
	cond = 'm.name regexp \'^[0-9]\''
elseif search and #search == 1 then
	cond = 'm.name like \'' .. search .. '%\''
else
	cond = 'm.name like \'%\''
end

local brands = query([[
	select
		m.id_manufacturer as bid,
		m.name as bname,
		count(1) as pcount
	from
		ps_manufacturer m
		left join ps_product p on
			p.id_manufacturer = m.id_manufacturer
	where
		]] .. cond .. [[
		and m.active = 1
	group by
		m.id_manufacturer
	order by
		m.name
]])

out_json(brands)

