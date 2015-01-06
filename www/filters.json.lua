
local catid = ...
catid = assert(uint_arg(catid))

local filters = {}
for i,t in groupby(query([[
	select
		f.fid,
		f.name as fname,
		v.vid,
		v.name as vname
	from
		filtercat fc
		inner join filter f on f.fid = fc.fid
		inner join filterval v on v.fid = f.fid
	where
		fc.catid = ?
	order by
		f.fid, v.vid
]], catid), 'fid') do
	local fid = t[1].fid
	local filter = {fname = t[1].fname, values = {}}
	table.insert(filters, filter)
	for i,t in ipairs(t) do
		table.insert(filter.values, {vid = t.vid, vname = t.vname})
	end
end

out(json(filters))
