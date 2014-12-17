
allow(admin())

local function table_grid_update(t) --table, idfield

	local self = t or {}

	local function get_idfield()
		if not self.idfield then
			self.idfield = query1(
				"show keys from "..self.table..
					" where key_name = 'PRIMARY'").Column_name
			return self.idfield
		end
	end

	local function whereidexpr()
		return ' where '..get_idfield()..' = ?'
	end

	local function setexpr(values)
		local keys, vals = {}, {}
		for k,v in glue.sortedpairs(values) do
			table.insert(keys, k .. ' = ?')
			table.insert(vals, v)
		end
		return ' set '..table.concat(keys, ', '), vals
	end

	function self.add(values)
		local setexpr, vals = setexpr(values)
		return iquery('insert into '..self.table..setexpr, unpack(vals))
	end

	function self.delete(id)
		query('delete from '..self.table..whereidexpr(), id)
	end

	function self.update(id, values)
		local setexpr, vals = setexpr(values)
		table.insert(vals, id)
		query('update '..tbl..setexpr..whereidexpr(), vals)
	end

	return self
end

local function sql_grid_fetch(t) --fetch_sql()

	local self = t or {}

	function self.fetch(...)
		local startrow = (self.startrow or 1)-1
		local maxrows = self.maxrows or 100
		local orderby = self.orderby

		local t,cols = query(self.fetch_sql()..
			(orderby and ' order by '..orderby or '')..
			' limit '..startrow..', '..maxrows)
		local rows = {}

		for i,t in ipairs(t) do
			local row = {}
			rows[i] = row
			for j,col in ipairs(cols) do
				row[j] = t[col.name]
			end
		end

		--set fields sort flag from the orderby spec
		local sortcol = {}
		if orderby then
			for s in glue.gsplit(orderby, ',') do
				local col, dir = s:match'^([^%s]+)%s*(.*)$'
				if dir == '' then dir = 'asc' end
				sortcol[col] = dir
			end
		end

		local fields = {}
		for i,col in ipairs(cols) do
			fields[i] = {
				name = col.name,
				sort = sortcol[col.name],
			}
		end

		return {
			fields = fields,
			rows = rows,
		}
	end

	return self
end

local function table_grid_fetch(t) --table, fields

	local self = sql_grid_fetch(t)

	function self.fetch_sql()
		return 'select '..(self.fields or '*')..' from '..self.table
	end

	return self
end

local function table_grid(t) --table, fields, idfield
	t = t or {}
	table_grid_fetch(t)
	table_grid_update(t)
	return t
end

local function rest_grid(grid)

	local self = {}

	function self.fetch(...)
		grid.orderby = GET.sort and GET.sort:gsub(':', ' ') --col:desc -> col desc
		grid.startrow = GET.i0 and tonumber(GET.i0)
		grid.maxrows = GET.n and tonumber(GET.n)
		return grid.fetch(...)
	end

	function self.add()
		local data = json(POST.data)
		return grid.add(data.values)
	end

	function self.delete()
		local data = json(POST.data)
		return grid.delete(data.id)
	end

	function self.update()
		local data = json(POST.data)
		return grid.update(data.id, data.values)
	end

	return function(action, ...)
		action = check(self[action or 'fetch'])
		out(json(action(...)))
	end
end

local tbl = ... or 'usr'
local grid = rest_grid(table_grid{table = tbl})
grid(select(2, ...))

