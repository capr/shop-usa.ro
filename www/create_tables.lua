
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

local nodrop --= true

local function constable(name)
	return query1([[
		select c.table_name from information_schema.table_constraints c
		where c.table_schema = ? and c.constraint_name = ?
	]], db_name, name)
end

local function dropfk(name)
	if nodrop then return end
	local tbl = constable(name)
	if not tbl then return end
	pq('alter table '..tbl..' drop foreign key '..name..';')
end

local function droptable(name)
	if nodrop then return end
	pq('drop table if exists '..name..';')
end

local function fkname(tbl, col)
	return string.format('fk_%s_%s', tbl, col:gsub('%s', ''):gsub(',', '_'))
end

function macro.fk(tbl, col, ftbl, fcol, ondelete, onupdate)
	ondelete = ondelete or 'cascade'
	onupdate = onupdate or 'restrict'
	local a1 = ondelete ~= 'restrict' and ' on delete '..ondelete or ''
	local a2 = onupdate ~= 'restrict' and ' on update '..onupdate or ''
	return string.format(
		'constraint %s foreign key (%s) references %s (%s)%s%s',
		fkname(tbl, col), col, ftbl, fcol or col, a1, a2)
end

function macro.uk(tbl, col)
	return string.format(
		'constraint uk_%s_%s unique key (%s)',
		tbl, col:gsub('%s', ''):gsub(',', '_'), col)
end

local function fk(tbl, col, ...)
	if constable(fkname(tbl, col)) then return end
	local sql = string.format('alter table %s add ', tbl)..
		macro.fk(tbl, col, ...)..';'
	pq(sql)
end

------------------------------------------------------------------------------

--ddl commands
subst'table  create table if not exists'

--type domains
subst'id      int unsigned'
subst'pk      int unsigned primary key auto_increment'
subst'name    varchar(32)'
subst'email   varchar(128)'
subst'url     varchar(2048)'
subst'pass    varchar(32)'
subst'bool    tinyint not null default 0'
subst'bool1   tinyint not null default 1'
subst'atime   timestamp default current_timestamp'
subst'mtime   timestamp' --on update current_timestamp
subst'money   decimal(20,6)'

--drop everything
droptable'convrate'
droptable'ordritem'
droptable'ordr'
droptable'cartitem'
droptable'usr'

--create everything
ddl[[
$table usr (
	uid         $pk,
	anonymous   $bool1,
	email       $email,
	emailvalid  $bool,
	pass        $pass,
	facebookid  $name,
	googleid    $name,
	gimgurl     $url,
	active      $bool1,
	firstname   $name,
	lastname    $name,
	phone       $name,
	gender      $name,
	birthday    date,
	newsletter  $bool,
	admin       $bool,
	note        text,
	clientip    $name,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table cartitem (
	ciid        $pk,
	uid         $id not null, $fk(cartitem, uid, usr),
	pid         $id not null, $fk(cartitem, pid, ps_product, id_product),
	coid        $id, $fk(cartitem, coid, ps_product_attribute, id_product_attribute),
	qty         $id not null default 1,
	pos         $id,
	buylater    $bool,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table ordr (
	oid         $pk,
	uid         $id not null, $fk(ordr, uid, usr),
	name        $name,
	email       $email,
	phone       $name,
	addr        text,
	city        $name,
	county      $name,
	country     $name,
	note        text,
	delivery    $name not null,
	shipping    $money not null,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table ordritem (
	oiid        $pk,
	oid         $id not null, $fk(ordritem, oid, ordr),
	coid        $id not null, $fk(ordritem, coid, ps_product_attribute, id_product_attribute),
	qty         $id not null default 1,
	price       $money not null,
	atime       $atime,
	mtime       $mtime
);
]]

ddl[[
$table convrate (
	ron         $money not null,
	usd         $money not null,
	date        date not null,
	primary key (ron, usd, date)
)
]]
