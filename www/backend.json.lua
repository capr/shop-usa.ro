--[[
TODO:
	- sort
	- move columns
	- resize columns
	- visible columns menu
	- column filter

	- persist report customization:
		- column order
		- column visibility
		- column sorting
		- column sizes

	-

]]

allow(admin())

local rep = {}

rep.tables = {
	query = 'show tables',
	fields = {
		Tables_in_prestashop = {
			--[[
			format = function(name)
				return string.format('<a href="/backend/table/%s">%s</a>', name, name)
			end,
			]]
		},
	},
	id = 'Tables_in_prestashop',
	detail = 'table',
}

rep.table = {
	query = function(name)
		return query('select * from '..name)
	end,
}

local repname = ... or 'tables'
local rep = rep[repname]

local q = rep.query
if type(q) == 'string' then
	q = function(...)
		return query(rep.query, ...)
	end
end
local t = q(select(2, ...))

if #t == 0 then
	out(json{fields = {}, rows = {}})
	return
end

local fields = glue.keys(t[1])
table.sort(fields)

local rows = {}
for i,row in ipairs(t) do
	local t = {}
	rows[i] = {values = t, id = row[rep.id]}
	for j,field in ipairs(fields) do
		local def = rep.fields and rep.fields[field]
		local format = def and def.format or glue.pass
		t[j] = format(row[field])
	end
end

out(json{detail = rep.detail, fields = fields, rows = rows})
