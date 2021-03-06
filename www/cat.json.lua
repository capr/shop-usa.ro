require'cat'

if POST then
	allow(editmode())
	local action = ...
	if action == 'reorder' then
		local catids = json(POST.data)
		for i,catid in ipairs(catids) do
			query([[
				update ps_category set
					position = ?
				where
					id_category = ?
			]], i, catid)
		end
	else
		local data = json(POST.data)
		local catid = data.catid
		if action == 'add' then
			atomic(function()
				query([[
					insert into ps_category (id_parent, active) values (?, 0);
					set @catid = last_insert_id()
				]], catid)
				query([[
					insert into ps_category_lang (id_category, id_lang, name)
					values (@catid, 1, ?)
				]], data.name)
				query([[
					insert into ps_category_shop (id_category, id_shop)
					values (@catid, 1)
				]])
				for gid=1,3 do --group ids for visitor, guest, customer
					query([[
						insert into ps_category_group (id_category, id_group)
						values (@catid, ?)
					]], gid)
				end
			end)
		elseif action == 'rename' then
			query([[
				update ps_category_lang set name = ?
				where id_lang = 1 and id_category = ?
			]], data.name, catid)
		elseif action == 'remove' then
			query('delete from ps_category_product where id_category = ?', catid)
			query('delete from ps_category_group   where id_category = ?', catid)
			query('delete from ps_category_shop    where id_category = ?', catid)
			query('delete from ps_category_lang    where id_category = ?', catid)
			query('delete from ps_category         where id_category = ?', catid)
		elseif action == 'setactive' then
			query([[
				update ps_category set active = ?
				where id_category = ?
			]], data.active, catid)
		end
	end
end

local cats = query([[
	select
		c.id_category as id,
		c.id_parent as pid,
		c.is_root_category as root,
		cl.name,
		c.level_depth as level,
		c.product_count as count,
		c.active
	from
		ps_category c
	inner join
		ps_category_lang cl on
			cl.id_category = c.id_category
			and cl.id_lang = 1
	]]..(not editmode() and [[
	where
		c.active = 1
	]] or '')..[[
	order by
		c.id_parent,
		c.position
]])

local cats = make_cat_tree(cats)
out(json(cats))
