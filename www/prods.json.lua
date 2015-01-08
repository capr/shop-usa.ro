require'filters'

local catid, page, pagesize, order, q, fq = ...
catid = assert(uint_arg(catid))
page  = tonumber(page) or 1
pagesize = clamp(tonumber(pagesize) or 99, 1, 99)
local offset = (page - 1) * pagesize
order = order ~= '-' and order or ''
order = str_arg(order) or 'date'
q = q ~= '-' and str_arg(q) or nil
local fq_sql = fq and parse_fq(fq)

local function select_prods(count)

	local sort_col = {
		date = 'p.date_upd', --asc is desc
		price = 'p.price',
		discount = 'p.discount desc',
	}

	--note: we sort by "oldest first" to get "newest first"
	--because we crawl from page 1 up so page 1 is the oldest.
	local sql = [[
		select
	]] .. (count and [[
			1
	]] or [[
			p.id_product as pid,
			pl.name,
			$ronprice(p.price, ]] .. quote(usd_rate()) .. [[) as price,
			$ronprice(p.msrp, ]] .. quote(usd_rate()) .. [[) as msrp,
			p.discount,
			i.id_image as imgid,
			m.name as bname
	]]) .. [[
		from
			ps_product p
		inner join ps_category_product cp on
			cp.id_product = p.id_product
			and cp.id_category = ]] .. quote(catid) .. [[
	]] .. (not count and [[
		left join ps_image i on
			i.id_product = p.id_product
			and i.cover = 1
		inner join ps_product_lang pl on
			pl.id_product = p.id_product
			and pl.id_lang = 1
		inner join ps_manufacturer m on
			m.id_manufacturer = p.id_manufacturer
	]] or '') .. (fq_sql and fq_sql or '') .. [[
		where
			p.active = 1
	]] .. (q and [[
			and (
				p.id_product = ]]..quote(q)..[[
				or m.name like ]]..quote(q..'%')..[[
				or pl.name like ]]..quote(q..'%')..[[
			)
	]] or '') .. (not count and [[
		group by
			p.id_product
		order by
	]] .. (assert(sort_col[order])) or '') .. (not count and [[
		limit
	]] .. offset .. ', ' .. pagesize or '')

	if count then
		return tonumber(query1('select count(1) as count from ('..sql..') t'))
	else
		return query(sql)
	end
end

out(json({
	prods = select_prods(),
	prod_count = select_prods'count',
}))
