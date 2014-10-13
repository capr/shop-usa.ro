--category tree --------------------------------------------------------------

local cats = query([[
	select
		c.id_category as id,
		c.id_parent as pid,
		c.is_root_category as root,
		cl.name,
		c.product_count as count
	from
		ps_category c,
		ps_category_lang cl
	where
		c.active = 1
		and cl.id_category = c.id_category
	order by
		c.id_parent,
		c.position
]])

local function maketree(t)

	--get child index ranges
	local ci = {} --child index ranges: {pid = {index1, index2}}
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

	--make the tree and the node map
	local node_map = {} --{node_id = node}
	local function make(node, parent)
		local e = {node.id, node.name, node.count}
		node_map[node.id] = e
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
	return make(root), node_map
end

local function update_product_counts()
	query[[
		update
			ps_category c
		set
			c.product_count = (
				select
					count(1)
				from
					ps_category_product cp,
					ps_product p
				where
					p.active = 1
					and p.id_product = cp.id_product
					and cp.id_category = c.id_category
			)
	]]
end

--update_product_counts()
local tree, node_map = maketree(cats)

out_json(tree)

