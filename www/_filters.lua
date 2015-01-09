setfenv(1, require'g')

function parse_fq(fq)
	local fqt = {}
	for s in fq:gmatch'[^;]+' do
		local t = {}
		for s in s:gmatch'[^,]+' do
			table.insert(t, tonumber(glue.trim(s)))
		end
		table.insert(fqt, t)
	end
	return fqt
end

function fqt_joins(fqt)
	local joins = {}
	for i,t in ipairs(fqt) do
		local join = {}
		for i,vid in ipairs(t) do
			table.insert(join, string.format('fp%d.vid = %d', #joins, vid))
		end
		assert(#joins < 20)
		table.insert(joins,
			string.format(
				'inner join filterprod fp%d on ' ..
				'fp%d.pid = p.id_product and (' ..
				table.concat(join, ' or ') .. ')', #joins, #joins))
	end
	return table.concat(joins, '\n')
end

