--database query function
setfenv(1, require'_g')
local mysql = require'resty.mysql'

db_host = '10.1.1.105'
db_user = 'root'
db_pass = 'abcd12'
db_name = 'prestashop'
connect_timeout = 1 --seconds
db_timeout = 30 --seconds

print_queries = false

local db --global db object

local function assert_db(ret, err, errno, sqlstate)
	if ret ~= nil then return ret end
	error('db error: '..err..': '..(errno or '')..' '..(sqlstate or ''))
end

local function connect()
	if conn then return end
	db = assert(mysql:new())
	db:set_timeout(connect_timeout * 1000)
	assert_db(db:connect{
		host = db_host,
		port = 3306,
		database = db_name,
		user = db_user,
		password = db_pass,
	})
	db:set_timeout(db_timeout * 1000)
end

function quote(s)
	return ngx.quote_sql_str(tostring(s))
end

local tran = {}

local function set_params(sql, ...)
	local t = {}
	for i = 1, select('#', ...) do
		local arg = select(i, ...)
		t[i] = quote(arg)
	end
	--TODO: skip string literals
	local i = 0
	return sql:gsub('%?', function() i = i + 1; return t[i] end)
end

local function run_query(sql)
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

function query_(sql, ...) --query, iterate rows and close
	connect()
	sql = set_params(sql, ...)
	if #tran > 0 then --we're inside atomic()
		table.insert(tran[#tran], sql)
	else
		return run_query(sql)
	end
end

--concatenate queries instead of running them, and then run them all
--as a single multi-statement query, wrapped inside a transaction.
--NOTE: results of intermediate queries are not available immediately.
function atomic(func)
	local t = {'start transaction'}
	table.insert(tran, t)
	func()
	table.remove(tran)
	table.insert(t, 'commit;')
	local sql = table.concat(t, ';')
	return run_query(sql)
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
