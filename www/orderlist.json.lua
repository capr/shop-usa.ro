
local filter, q = ...
local q = q or ''
local q = '%'..q..'%'

allow(admin())

local sel = [[
		select
			o.oid, o.email, o.name, o.phone, o.addr, o.city, o.county, o.country,
			o.note, o.shiptype, o.shipcost, o.status, o.atime, o.mtime,
			o.note, o.uid,
			o.opnote,
			u.name as opname,
			u.email as opemail,
			if(field(o.status, 'shipped', 'canceled', 'returned') = 0, 1, 0) as open
		from
			ordr o
			left join usr u on u.uid = o.opuid
]]

local orders
if filter == 'open' then
	orders = query(sel .. [[
		where
			field(o.status, 'open') <> 0
			and o.opuid = ?
		]], uid())
else
	orders = query(sel .. [[
		where
			o.name like ?
			or o.email like ?
			or o.phone like ?
			or exists (
				select 1
				from
					ordritem oi
				inner join ps_product_attribute pa
					on pa.id_product_attribute = oi.coid
				inner join ps_product_lang pl
					on pl.id_product = pa.id_product
				where
					oi.oid = o.oid and (
						pa.id_product like ?
						or pl.name like ?
					)
				)
		order by
			open,
			o.mtime desc
		]], q, q, q, q, q)
end

for i,o in ipairs(orders) do
	o.open = tonumber(o.open) == 1
end

out(json{orders = orders})
