
local function pq(sql, ...)
	print(sql, ...)
	return query(sql, ...)
end

--ddl macro language ---------------------------------------------------------

local substs = {}

local function subst(def) --'name type'
	local name, val = def:match'(%w+)%s+(.*)'
	substs[name] = val
end

local macro = {}

local function macro_subst(name, args)
	local macro = assert(macro[name], 'invalid macro')
	args = args:sub(2,-2)..','
	local t = {}
	for arg in args:gmatch'([^,]+)' do
		arg = glue.trim(arg)
		t[#t+1] = arg
	end
	return macro(unpack(t))
end

local function ddl(sql)
	sql = sql:gsub('$(%w+)(%b())', macro_subst)
	sql = sql:gsub('$(%w+)', substs)
	pq(sql)
end

--ddl vocabulary -------------------------------------------------------------

local function constable(name)
	return query1([[
		select c.table_name from information_schema.table_constraints c
		where c.table_schema = ? and c.constraint_name = ?
	]], db_name, name)
end

local function dropfk(name)
	local tbl = constable(name)
	if not tbl then return end
	pq('alter table '..tbl..' drop foreign key '..name..';')
end

local function droptable(name)
	pq('drop table if exists '..name..';')
end

--ddl commands
subst'table  create table if not exists'

--type domains
subst'id     int unsigned'
subst'pk     int unsigned primary key auto_increment'
subst'name   varchar(32)'
subst'email  varchar(128)'
subst'pass   varchar(32)'
subst'bool   tinyint not null'
subst'atime  timestamp default current_timestamp'
subst'mtime  timestamp' --on update current_timestamp

function macro.fk(tbl, col, ftbl, fcol, ondelete, onupdate)
	ondelete = ondelete or 'cascade'
	onupdate = onupdate or 'restrict'
	local a1 = ondelete ~= 'restrict' and ' on delete '..ondelete or ''
	local a2 = onupdate ~= 'restrict' and ' on update '..onupdate or ''
	return string.format(
		'constraint fk_%s_%s foreign key (%s) references %s (%s)%s%s',
		tbl, col:gsub('%s', ''):gsub(',', '_'), col, ftbl, fcol or col, a1, a2)
end

function macro.uk(tbl, col)
	return string.format(
		'constraint uk_%s_%s unique key (%s)',
		tbl, col:gsub('%s', ''):gsub(',', '_'), col)
end

local function fk(tbl, ...)
	local sql = string.format('alter table %s add ', tbl)..
		macro.fk(tbl, ...)..';'
	pq(sql)
end

------------------------------------------------------------------------------

dropfk'fk_session_cartid'
dropfk'fk_usr_cartid'

droptable'cartitem'
droptable'cart'
droptable'session'
droptable'usr'

ddl[[
$table usr (
	uid         $pk,
	firstname   $name not null,
	lastname    $name not null,
	email       $email not null,
	passwd      $pass not null,
	active      $bool,
	birthday    date,
	newsletter  $bool,
	admin       $bool,
	note        text,
	cartid      $id,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table session (
	sessid      $pk,
	uid         $id, $fk(session, uid, usr),
	clientip    varchar(32),
	cartid      $id,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table cart (
	cartid      $pk,
	uid         $id, $fk(cart, uid, usr),
	sessid      $id, $fk(cart, sessid, session)
);
]]

fk('session', 'cartid', 'cart')
fk('usr', 'cartid', 'cart')

ddl[[
$table cartitem (
	ciid        $pk,
	cartid      $id not null, $fk(cartitem, cartid, cart),
	pid         $id not null, $fk(cartitem, pid, ps_product, id_product),
	coid        $id, $fk(cartitem, coid, ps_product_attribute, id_product_attribute),
	qty         $id not null,
	pos         $id,
	buylater    $bool,
	atime       $atime,
	mtime       $mtime
);
]]

