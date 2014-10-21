setfenv(1, require'_g')

function make_cat_tree(t)

	--get child index ranges.
	local ci = {} --{pid = {index1, index2}}
	local root
	local pid
	for i=1, #t+1 do
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
		local e = {node.id, node.name, node.count or 0}
		local range = ci[node.id]
		if range then
			local i1, i2 = unpack(range)
			for i = i1, i2 do
				local ce = make(t[i], e)
				table.insert(e, ce)
			end
		end
		return e
	end
	return make(root)
end

