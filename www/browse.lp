<link rel="stylesheet" type="text/css" href="/main.css">
<?lua

local order_map = {new=true, price=true}

local catid, order, page = ...
catid = uint_arg(catid) or 2
order = order_map[order] and order or 'new'
page = uint_arg(page) or 1

local search = GET.q

local dids = {} --{did = dvid}
for k,v in pairs(GET) do
	local did = uint_arg(k)
	if did then
		dids[did] = id_arg(v)
	end
end

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
		local e = {name = node.name, id = node.id,
			count = node.count, parent = parent}
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

local function table_reverse(t)
	local n = #t
	for i = 1, math.floor(n/2) do
		t[i], t[n-i+1] = t[n-i+1], t[i]
	end
end

local function path_to_node(node)
	local t = {}
	while node.parent do
		t[#t+1] = node.parent
		node = node.parent
	end
	table_reverse(t)
	return t
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
local active_node = node_map[catid]

local function printtree()
	local nodes = path_to_node(active_node)
	for i,node in ipairs(nodes) do
		printf('<ul><li><a href="/browse/%d">%s</a> (%d)<ul>',
			node.id, node.name, node.count or '?')
	end
	printf('<ul><li>%s (%d)<ul>', active_node.name, active_node.count)
	for i,node in ipairs(active_node) do
		printf'<ul>'
		printf('<li><a href="/browse/%d">%s</a> (%d)</li>',
			node.id, node.name, node.count or '?')
		printf'</ul>'
	end
	for i=1,#nodes do
		printf'</li></ul>'
	end
end

--products -------------------------------------------------------------------

local pagesize = 100
local offset = (page - 1) * pagesize
local pagecount = math.ceil(active_node.count / pagesize)

local products = query([[
	select
		p.id_product as pid,
		pl.name,
		ps.price,
		i.id_image as imgid
	from
		ps_product p
	left join ps_image i on
		i.id_product = p.id_product
		and i.cover = 1
	inner join ps_product_shop ps on
		ps.id_product = p.id_product
		and ps.id_shop = 1
	inner join ps_category_product cp on
		cp.id_product = p.id_product
		and cp.id_category = ?
	inner join ps_product_lang pl on
		pl.id_product = p.id_product
	where
		p.active = 1
	limit
]]..offset..', '..pagesize, catid)

local function printproducts()

	printf'«'
	local dots = 0
	for i = 1, pagecount do
		if i == page then
			printf(i)
		elseif
			i == 1 or i == pagecount
			or (i >= page - 2 and i <= page + 1)
		then
			printf('<a href="/browse/%d/%s/%d">%d</a> ', catid, order, i, i)
		elseif dots < 2 then
			printf'...'
			dots = dots + 1
		end
	end
	printf'»'
	print'<br>'

	print'<table>'
	for i,t in ipairs(products) do
		local imgid = tostring(t.imgid or 0)
		local imgurl =
			'/img/p'..
			imgid:gsub('.', '/%1')..
			imgid..'-home_default.jpg'
		?>
		<tr>
			<td>
				<table>
					<tr>
						<td valign="top" width="300">
							<?=t.name?>
							<br>
							<?=t.price?>
						</td>
						<td valign="top">
							<img src="<?=imgurl?>">
						</td>
					</tr>
				</table>
			</td>
		</tr>
		<?lua
	end
	print'</table>'
end

--page layout ----------------------------------------------------------------

?>
<table cellpadding="10">
	<tr>
		<td valign="top">
			<?lua printtree() ?>
		</td>
		<td valign="top">
			<?lua printproducts() ?>
		</td>
	</tr>
</table>
