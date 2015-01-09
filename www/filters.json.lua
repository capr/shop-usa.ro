require'filters'

local catid, q, fq = ...
catid = assert(uint_arg(catid))
local q = str_arg(q); if q == '-' then q = nil end
local fqt = parse_fq(fq or '') --fqt: filter query table

--get all filters in order along with all their value ids.
local filters = {}
for i,t in groupby(query([[
	select
		f.fid,
		f.name as fname,
		v.vid
	from
		filtercat fc
		inner join filter f on f.fid = fc.fid
		inner join filterval v on v.fid = f.fid
	where
		fc.catid = ?
	order by
		f.pos, f.fid
]], catid), 'fid') do
	local filter = {fid = t[1].fid, fname = t[1].fname, vids = {}}
	table.insert(filters, filter)
	for i,t in ipairs(t) do
		table.insert(filter.vids, t.vid)
	end
end

--make a fidmap so we can track back fids from vids in fqt
local fidmap = {} -- {vid = fid}
for _,filter in ipairs(filters) do
	for _,vid in ipairs(filter.vids) do
		fidmap[vid] = filter.fid
	end
end

--return a modified fqt with all the vids of a particular fid excluded.
--if the fid is not found in fqt, return the original fqt without copying it.
--in english: return a filter query table that doesn't include filtering over
--the values of a particular filter. if the filter table doesn't contain any
--values from that filter, return the original filter table without copying
--it -- this last part is what prevents querying multiple times on the same fqt.
local function filtered_fqt(fqt, exclude_fid)
	local xi --exclude index
	for i,vids in ipairs(fqt) do
		local fid = fidmap[vids[1]] --assume same fid for all vids in group
		if fid == exclude_fid then
			xi = i
			break
		end
	end
	if not xi then
		return fqt --fid not in fqt, fqt not modified
	end
	--return a copy of fqt without the fid values at index xi
	local mfqt = {for_fids = {exclude_fid}}
	for i,vids in ipairs(fqt) do
		if i ~= xi then
			table.insert(mfqt, vids)
		end
	end
	return mfqt
end

--make and assign modified fqts for each filter.
for i,filter in ipairs(filters) do
	filter.fqt = filtered_fqt(fqt, filter.fid)
end

--compute `for_fids` field for the umodified fqt: all the filters that
--have the umodified fqt as their fqt get added.
fqt.for_fids = {}
for i,filter in ipairs(filters) do
	if filter.fqt == fqt then
		table.insert(fqt.for_fids, filter.fid)
	end
end

local function get_values(fqt)
	if fqt.values then return end --already got'em.
	fqt.values = {} --{fid = {val1, ...}}; val = {vid=, vname=, count=}
	local fids = table.concat(fqt.for_fids, ', ')
	for i,t in groupby(query([[
		select
			f.fid,
			v.vid,
			v.name as vname,
			count(1) as count
		from
			filter f
			inner join filterval v on v.fid = f.fid
			inner join filterprod fp on fp.vid = v.vid
			inner join ps_category_product cp on cp.id_product = fp.pid
			inner join ps_product p on p.id_product = cp.id_product
			]] .. fqt_joins(fqt) .. [[
		where
			cp.id_category = ?
			and p.active = 1
			and f.fid in (]] .. fids .. [[)
		group by
			v.vid
		order by
			f.pos, f.fid, v.pos, v.name
	]], catid), 'fid') do
		local values = {}
		for i,t in ipairs(t) do
			table.insert(values, {
				vid = t.vid,
				vname = t.vname,
				count = t.count,
				selected = fidmap[t.vid] and true or nil,
			})
		end
		local fid = t[1].fid
		fqt.values[fid] = values
	end
end

for i,filter in ipairs(filters) do
	--query on the fqt
	get_values(filter.fqt)
	--select the values of this filter out of the fqt's result set
	filter.values = filter.fqt.values[filter.fid]
end

--return only the filters that contain values.
local t = {}
for i,filter in ipairs(filters) do
	if filter.values then
		table.insert(t, {
			fid = filter.fid,
			fname = filter.fname,
			values = filter.values
		})
	end
end

out(json(t))
