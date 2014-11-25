setfenv(1, require'g')

function make_cat_tree(t)

	--get child index ranges.
	local ci = {} --{pid = {index1, index2}}
	local root
	local pid
	for i = 1, #t+1 do
		local t = t[i]
		if t and t.root == 1 then
			root = t
		end
		local newpid = t and tonumber(t.pid)
		if newpid ~= pid then
			if pid then
				ci[pid][2] = i-1
			end
			if newpid then
				ci[newpid] = {i}
			end
			pid = newpid
		end
	end

	--make the tree.
	local function make(node, parent)
		local e = {
			id = node.id,
			name = node.name,
			count = node.count or 0,
			active = node.active,
			cats = {},
		}
		local range = ci[node.id]
		if range then
			local i1, i2 = unpack(range)
			for i = i1, i2 do
				local ce = make(t[i], e)
				table.insert(e.cats, ce)
			end
		end
		return e
	end
	return make(root)
end

