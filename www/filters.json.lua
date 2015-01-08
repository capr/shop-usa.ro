require'filters'

local catid = ...
catid = assert(uint_arg(catid))

local filters = {}
for i,t in groupby(query([[
	select
		f.fid,
		f.name as fname,
		v.vid,
		v.name as vname,
		count(1) as count
	from
		filtercat fc
		inner join filter f on f.fid = fc.fid
		inner join filterval v on v.fid = f.fid
		inner join filterprod fp on fp.vid = v.vid
		inner join ps_category_product cp on cp.id_product = fp.pid
	where
		fc.catid = ?
		and cp.id_category = ?
	group by
		v.vid
	order by
		f.fid, v.vid
]], catid, catid), 'fid') do
	local filter = {fid = t[1].fid, fname = t[1].fname, values = {}}
	table.insert(filters, filter)
	for i,t in ipairs(t) do
		table.insert(filter.values, {vid = t.vid, vname = t.vname, count = t.count})
	end
end

out(json(filters))
