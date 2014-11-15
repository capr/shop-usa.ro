--database query function
setfenv(1, require'_g')
local mysql = require'resty.mysql'

db_host = '10.1.1.105'
db_user = 'root'
db_pass = 'abcd12'
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
	end
	return ngx.quote_sql_str(tostring(v))
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
	assert_db(db:send_query(sql))
	local t, err = assert_db(db:read_result())
	if err == 'again' then --multi-result/multi-statement query
		t = {t}
		repeat
			local t1, err = assert_db(db:read_result())
			t[#t+1] = t1
		until not err
	end
	for i,t in ipairs(t) do
		for k,v in pairs(t) do
			if v == ngx.null then
				t[k] = nil
			end
		end
	end
	return t
end

function query(sql, ...) --execute, iterate rows, close
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

function query1(sql, ...) --query first row (or first row/column) and close
	local row = query(sql, ...)[1]
	if not row then return end
	local k,v = next(row)
	if not next(row, k) then return v end --first row/col
	return row --first row
end

function iquery(sql, ...) --insert query: return autoincremented id
	return query(sql, ...).insert_id
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
