
local pid, coid = ...
pid = assert(uint_arg(pid))
acoid = uint_arg(coid)

--product --------------------------------------------------------------------

local prod = check(query1([[
	select
		p.id_product as pid,
		pl.name as name,
		pl.description as descr,
		m.id_manufacturer as bid,
		m.name as bname,
		i.id_image as imgid
	from
		ps_product p
		inner join ps_product_lang pl on
			pl.id_lang = 1
			and pl.id_product = p.id_product
		left join ps_image i on
			i.id_product = p.id_product
			and i.cover = 1
		left join ps_manufacturer m on
			m.id_manufacturer = p.id_manufacturer
	where
		p.id_product = ?
]], pid))

--combis ---------------------------------------------------------------------

local coid, co
local dnames = {} --{did = dname}
local dvnames = {} --{dvid = dvname}
local dpos = {} --{did = dpos}
local dvpos = {} --{dvid = dvpos}
local dvids = {} --{did = {dvid = true}}
local cot = {} --{{coid=, price=, qty=, dvid1, ...}, ...}
local init_dvids = {} --{did = dvid}

for i,t in ipairs(query([[
	select
		pa.id_product_attribute as coid,
		$ronprice(pa.price, ?) as price,
		$ronprice(pa.old_price, ?) as old_price,
		pa.quantity as qty,
		pa.default_on,
		ag.id_attribute_group as did,
		agl.name as dname,
		ag.position as dpos,
		a.id_attribute as dvid,
		al.name as dvname,
		a.position as dvpos
	from
		ps_product_attribute_combination co
		inner join ps_product_attribute pa on
			pa.id_product_attribute = co.id_product_attribute
		inner join ps_attribute a on
			a.id_attribute = co.id_attribute
		inner join ps_attribute_lang al on
			al.id_lang = 1
			and al.id_attribute = a.id_attribute
		inner join ps_attribute_group ag on
			ag.id_attribute_group = a.id_attribute_group
		inner join ps_attribute_group_lang agl on
			agl.id_lang = 1
			and agl.id_attribute_group = ag.id_attribute_group
	where
		pa.id_product = ?
	order by
		coid, dvid
]], usd_rate(), usd_rate(), pid)) do

	dnames[t.did] = t.dname
	dvnames[t.dvid] = t.dvname
	dpos[t.did] = t.dpos
	dvpos[t.dvid] = t.dvpos
	dvids[t.did] = dvids[t.did] or {}
	dvids[t.did][t.dvid] = true

	if coid ~= t.coid then --next combi
		coid = t.coid
		co = {coid = t.coid, price = t.price, qty = t.qty}
		table.insert(cot, co)
	end
	table.insert(co, t.dvid) --dvids come sorted (we need that)
	if (acoid and t.coid == acoid) or (not acoid and t.default_on == 1) then
		init_dvids[t.did] = t.dvid
	end
end

--{{did=, dname=, dvals = {{dvid = dvid1, dvname = dvname1}, ...}}, ...}
prod.dims = {}

for did, dname in pairs(dnames) do
	local dim = {did = did, dname = dname, dvals = {}}
	table.insert(prod.dims, dim)

	local dvids = glue.keys(dvids[did]) --{dvid1, ...}

	--sort dvids by (dvpos, dvname).
	table.sort(dvids, function(dvid1, dvid2)
		local dvpos1, dvpos2 = dvpos[dvid1], dvpos[dvid2]
		if dvpos1 == dvpos2 then
			return dvnames[dvid1] < dvnames[dvid2]
		else
			return dvpos1 < dvpos2
		end
	end)

	for i,dvid in ipairs(dvids) do
		table.insert(dim.dvals, {
			dvid = dvid, dvname = dvnames[dvid],
			selected = dvid == init_dvids[did] and 'selected' or nil,
		})
	end
end

--sort dims by (dpos, did).
table.sort(prod.dims, function(d1, d2)
	local did1, did2 = d1.did, d2.did
	local dpos1, dpos2 = dpos[did1], dpos[did2]
	if dpos1 == dpos2 then
		return did1 < did2
	else
		return dpos1 < dpos2
	end
end)

prod.combis = {} --{['dvid1 dvid2 ...'] = {coid=, price=, qty=, imgs=}}}
local combi_map = {} --{coid = 'dvid1 dvid2 ...'}

for i,co in ipairs(cot) do
	local dvids = table.concat(co, ' ') --'dvid1 dvid2 ...' sorted numerically
	combi_map[co.coid] = dvids
	prod.combis[dvids] = {coid = co.coid, price = co.price, qty = co.qty}
end

--images ---------------------------------------------------------------------

for i,t in ipairs(query([[
	select
		pai.id_product_attribute as coid,
		pai.id_image as imgid
	from
		ps_product_attribute_image pai
		inner join ps_product_attribute pa on
			pa.id_product_attribute = pai.id_product_attribute
		inner join ps_image i on
			i.id_image = pai.id_image
	where
		pa.id_product = ?
	order by
		coid, i.position, imgid
]], pid)) do
	local dvids = combi_map[t.coid]
	local combi = prod.combis[dvids]
	combi.imgs = combi.imgs or {}
	table.insert(combi.imgs, tonumber(t.imgid))
end

--category paths -------------------------------------------------------------

local cats = {}
for i,t in ipairs(query([[
	select
		c.id_category as catid,
		c.id_parent as pcatid,
		cl.name as catname
	from
		ps_category_product cp
		inner join ps_category c
			on c.id_category = cp.id_category
			and c.id_category >= 100000000
		inner join ps_category_lang cl
			on cl.id_category = c.id_category
			and cl.id_lang = 1
	where
		cp.id_product = ?
]], pid)) do
	cats[t.catid] = t
end

local root
for catid,t in pairs(cats) do
	local pcat = cats[t.pcatid]
	if pcat then
		pcat.cat = t
	else
		root = t
	end
end

prod.path = {}
local function addcat(t)
	table.insert(prod.path, {catid = t.catid, catname = t.catname, last = not t.cat or nil})
	if t.cat then
		addcat(t.cat)
	end
end
if root then
	addcat(root)
end

out(json(prod))
