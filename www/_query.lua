--database query function
setfenv(1, require'_g')
local mysql = require'resty.mysql'

db_host = '10.1.1.105'
db_user = 'root'
db_pass = 'abcd12'
db_name = 'prestashop'

print_queries = false

local db --global db object

local function assert_db(ret, err, errno, sqlstate)
	if ret ~= nil then return ret end
	error('db error: '..err..': '..(errno or '')..' '..(sqlstate or ''))
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
	db:set_timeout(50000)
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
	local t = assert_db(db:query(sql))
	for i,t in ipairs(t) do
		for k,v in pairs(t) do
			if v == ngx.null then
				t[k] = nil
			end
		end
	end
	return t
end

--query frontends ------------------------------------------------------------

function query(sql, ...)
	return query_(sql, ...)
end

function query1(sql, ...) --query first row and close
	return query_(sql, ...)[1]
end

function insertquery(sql, ...) --insert query: return autoincremented id
	local res = query_(sql, ...)
	return res.insert_id
end

