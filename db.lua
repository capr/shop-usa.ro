--database query function
local mysql = require'resty.mysql'

db_host = '10.1.1.105'
db_user = 'root'
db_pass = 'abcd12'
db_name = 'prestashop'

print_queries = false

local db --global db object

local function assert_db(ret, err, errno, sqlstate)
	if ret ~= nil then return ret end
	error('db error: '..err..': '..errno..' '..sqlstate)
end

local function connect()
	if conn then return end
	db = assert(mysql:new())
	db:set_timeout(1000)
	assert_db(db:connect{
		host = db_host,
		port = 3306,
		database = db_name,
		user = db_user,
		password = db_pass,
	})
end

function query_(sql, ...) --query, iterate rows and close
	connect()
	local t = {}
	for i = 1, select('#', ...) do
		local arg = select(i, ...)
		t[i] = ngx.quote_sql_str(tostring(arg))
	end
	local i = 0
	--TODO: skip string literals
	sql = sql:gsub('%?', function() i = i + 1; return t[i] end)
	return assert_db(db:query(sql))
end

--query frontends ------------------------------------------------------------

function query(sql, ...)
	local res = query_(sql, ...)
	local i = 0
	return function()
		i = i + 1
		return res[i]
	end
end

function query1(sql, ...) --query first row and close
	return query_(sql, ...)[1]
end

function insertquery(sql, ...) --insert query: return autoincremented id
	local res = query_(sql, ...)
	return res.insert_id
end

