--database query function
setfenv(1, require'_g')
local mysql = require'resty.mysql'

db_host = '127.0.0.1'
db_user = 'root'
db_pass = ''
db_name = 'prestashop'
connect_timeout = 1 --seconds
db_timeout = 30 --seconds

local db --global db object

local function assert_db(ret, err, errno, sqlstate)
	if ret ~= nil then return ret, err end
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

function quote(v)
	if v == nil then
		return 'null'
	elseif v == true then
		return 1
	elseif v == false then
		return 0
	elseif type(v) == 'string' or type(v) == 'number' then
		return ngx.quote_sql_str(tostring(v))
	else
		return nil, 'invalid arg '.. require'pp'.format(v)
	end
end

local function set_params(sql, ...)
	local t = {}
	for i = 1, select('#', ...) do
		local arg = select(i, ...)
		local v, err = quote(arg)
		if err then
			error(err .. ' in query "' .. sql .. '"')
		end
		t[i] = v
	end
	--TODO: skip string literals
	local i = 0
	return sql:gsub('%?', function() i = i + 1; return t[i] end)
end

local function remove_nulls(t)
	for i,t in ipairs(t) do
		for k,v in pairs(t) do
			if v == ngx.null then
				t[k] = nil
			end
		end
	end
end

local function count_cols(t)
	if not t[1] then return end
	local n = 0
	for k,v in pairs(t[1]) do
		n = n + 1
	end
	return n
end

local function run_query(sql)
	assert_db(db:send_query(sql))
	local t, err = assert_db(db:read_result())
	local n = count_cols(t)
	remove_nulls(t)
	if err == 'again' then --multi-result/multi-statement query
		t = {t}
		repeat
			local t1, err = assert_db(db:read_result())
			remove_nulls(t1)
			t[#t+1] = t1
		until not err
	end
	return t, n
end

function query_(sql, ...) --execute, iterate rows, close
	connect()
	sql = set_params(sql, ...)
	return run_query(sql)
end

function query(...)
	return (query_(...))
end

function query1(sql, ...) --query first row (or first row/column) and close
	local t, n = query_(sql, ...)
	local row = t[1]
	if not row then return end
	if n == 1 then
		local _,v = next(row)
		return v
	end --first row/col
	return row --first row
end

function iquery(sql, ...) --insert query: return autoincremented id
	return query_(sql, ...).insert_id
end

function atomic(func)
	query'start transaction'
	local ok, err = glue.pcall(func)
	query(ok and 'commit' or 'rollback')
	assert(ok, err)
end

function groupby(items, col, cb)
	local t = {}
	local v
	local st
	for i,e in ipairs(items) do
		if not st or v ~= e[col] then
			st = {}
			t[#t+1] = st
		end
		st[#st+1] = e
		v = e[col]
	end
	return ipairs(t)
end
