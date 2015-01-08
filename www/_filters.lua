setfenv(1, require'g')

function parse_fq(fq)
	local joins = {}
	for s in fq:gmatch'[^;]+' do
		local t = {}
		for s in s:gmatch'[^,]+' do
			table.insert(t, string.format('fp%d.vid = %d', #joins, tonumber(glue.trim(s))))
		end
		assert(#joins < 20)
		table.insert(joins,
			string.format(
				'inner join filterprod fp%d on ' ..
				'fp%d.pid = p.id_product and (' ..
				table.concat(t, ' or ') .. ')', #joins, #joins))
	end
	return table.concat(joins, '\n')
end

