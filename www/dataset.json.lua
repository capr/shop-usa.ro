
allow(admin())

local function table_grid_update(t) --table, idfield

	local self = t or {}

	local function get_idfield()
		if not self.idfield then
			self.idfield = query1(
				"show keys from "..self.table..
					" where key_name = 'PRIMARY'").Column_name
		end
		return self.idfield
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
		query('update '..self.table..setexpr..whereidexpr(), unpack(vals))
	end

	self.get_idfield = get_idfield

	return self
end

local function pack_rows(t, cols)
	local rows = {}
	for i,t in ipairs(t) do
		local row = {}
		rows[i] = row
		for j,col in ipairs(cols) do
			row[j] = t[col.name]
		end
	end
	return rows
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

		local rows = pack_rows(t, cols)

		--set fields sort flag from the orderby spec
		local sortcol = {}
		if orderby then
			for s in glue.gsplit(orderby, ',') do
				local col, dir = s:match'^([^%s]+)%s*(.*)$'
				if dir == '' then dir = 'asc' end
				sortcol[col] = dir
			end
		end

		--decode field types and flags
		local coltypes = {
			[0] = 'number', [1] = 'number',
			[2] = 'number', [3] = 'number',
			[4] = 'number', [5] = 'number',
			[6] = 'null', [7] = 'datetime',
			[8] = 'number', [9] = 'number',
			[10] = 'date', [11] = 'time',
			[12] = 'datetime', [13] = 'number',
			[14] = 'date', [15] = 'text',
			[16] = 'number', [17] = 'datetime',
			[18] = 'datetime', [19] = 'time',
			[246] = 'number', [247] = 'lookup',
			[248] = 'list', [249] = 'file',
			[250] = 'file', [251] = 'file',
			[252] = 'file', [253] = 'text',
			[254] = 'text',
		}

		local nolength = {
			date = true, time = true, datetime = true,
			lookup = true, list = true
		}

		local has_decimals = { [0] = true, [246] = true, }

		local function hasflag(flags, flag)
			return bit.band(flags, flag) == flag or nil
		end

		local fields = {}
		for i,col in ipairs(cols) do
			local coltype = coltypes[col.type]
			if coltype == 'file' and not hasflag(col.flags, 128) then
				coltype = 'text'
			end
			fields[i] = {
				name = col.name,
				sort = sortcol[col.name],
				type = coltype,
				maxsize = not nolength[coltype] and col.length or nil,
				decimals = has_decimals[col.type] and col.decimals or nil,
				default = col.default,
				not_null = hasflag(col.flags, 1),
				pk = hasflag(col.flags, 2),
				uk = hasflag(col.flags, 4),
				unsigned = hasflag(col.flags, 32),
				--readonly =
			}
		end

		return {
			fields = fields,
			values = rows,
			idfield = self.get_idfield(),
		}
	end

	return self
end

local function table_grid_fetch(t) --table, fields

	local self = sql_grid_fetch(t)

	function self.fetch_sql()
		return 'select '..(self.fields or '*')..' from '..self.table
	end

	function self.get(id)
		local t, cols = query(
			'select '..(self.fields or '*')..' from '..self.table..
			' where '..self.get_idfield()..' = ?', id)
		local record = {id = id, values = {}}
		for j,col in ipairs(cols) do
			record.values[j] = t[1][col.name]
		end
		return record
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
		local t = {}
		for i,rec in ipairs(data.records) do
			local ok, err = pcall(grid.update, rec.id, rec.values)
			local rec = grid.get(rec.id)
			if not ok then
				rec.error = err
			end
			t[#t+1] = rec
		end
		return {records = t}
	end

	return function(action, ...)
		action = check(self[action or 'fetch'])
		local t = action(...)
		out(json(t or {ok = true}))
	end
end

local tbl = ... or 'usr'
local grid = rest_grid(table_grid{table = tbl})
grid(select(2, ...))

