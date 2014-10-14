setfenv(1, require'_g')
local glue = require'glue'
local lp = require'_lp'
local lfs = require'lfs'
local cjson = require'cjson'
local pp_ = require'pp'
require'_query'

--print API ------------------------------------------------------------------

function print(...)
	local n = select('#',...)
	if n == 0 then
		--nothing
	elseif n == 1 then
		ngx.say(tostring(...))
	else
		local t = {}
		for i=1,n do
			t[i] = tostring((select(i, ...)))
		end
		ngx.header['Content-Type'] = 'text/plain'
		ngx.say(table.concat(t, '\t'))
	end
	ngx.say'\n'
end

function pp(v)
	print(pp_.format(v, '   '))
end

function printf(...)
	ngx.say(string.format(...))
end

function out_json(t)
	ngx.header['Content-Type'] = 'application/json'
	ngx.say(cjson.encode(t))
	ngx.exit(0)
end

--request API ----------------------------------------------------------------

local function parse_request()
	GET = ngx.req.get_uri_args()
	local method = ngx.req.get_method()
	if method == 'POST' then
		ngx.req.read_body()
		POST = ngx.req.get_post_args()
	end
end

function uint_arg(s)
	return s and tonumber(s:match'(%d+)$')
end

function clamp(x, min, max)
	return math.min(math.max(x, min), max)
end

--reply API ------------------------------------------------------------------

function check(ret, ...)
	if ret then return ret, ... end
	ngx.status = 404
	ngx.exit(0)
end

--action API -----------------------------------------------------------------

--path -> action, args
local function parse_path()
	local path = ngx.var.uri
	local ext = path:match'%.([^%.]+)$'
	local action, sargs = path:match'^/([^/]+)(/?.*)$'
	sargs = sargs or ''
	local args = {}
	for s in sargs:gmatch'[^/]+' do
		args[#args+1] = s
	end
	return action, args
end

local function filepath(file, basedir)
	basedir = basedir or '../www'
	if file:find('..', 1, true) then return end --trying to escape
	if file:find'^_' then return end --private module
	local path = basedir .. '/' .. file
	if not lfs.attributes(path, 'mode') then return end
	return path
end

local chunks = {} --{action = chunk}

function action(action, ...)
	local chunk = chunks[action]
	if not chunk then
		local luapath = filepath(action..'.lua')
		local lppath = not luapath and filepath(action..'.lp')
		if not luapath and not lppath then
			ngx.redirect'/'
		end
		if lppath then
			lp.nocache = nocache
			lp.setoutfunc'ngx.say'
			local template = glue.readfile(lppath)
			chunk = lp.compile(template, action, _G)
		else
			chunk = assert(loadfile(luapath))
		end
		setfenv(chunk, getfenv(1))
		if not nocache then
			chunks[action] = chunk
		end
	end
	return chunk(...)
end

include = lp.include

--main -----------------------------------------------------------------------

local function check_img()
	local path = ngx.var.uri

	--not an image
	if not path:find'^/img/p/' then return end

	--check for short form and make an internal redirect.
	local imgid, size = path:match'^/img/p/(%d+)-(%w+)%.jpg'
	if imgid then
		path = '/img/p'..imgid:gsub('.', '/%1')..'/'..imgid..'-'..size..'_default.jpg'
		ngx.header['Cache-Control'] = 'max-age='.. (24 * 3600)
		ngx.exec(path)
	end

	--redirect to default image (default is 302-moved-temporarily)
	local size = path:match'%-(%w+)_default.jpg$' or 'home'
	ngx.redirect('/img/p/en-default-'..size..'_default.jpg')
end

local function main()
	check_img()
	parse_request()
	local act, args = parse_path()
	act = act or 'browse'
	action(act, unpack(args))
end

return main

