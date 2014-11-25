setfenv(1, require'g')
glue = require'glue'
require'query'
require'sendmail'
require'session'
require'rates'

--print API ------------------------------------------------------------------

function print(...)
	local n = select('#', ...)
	if n == 0 then return end
	ngx.header['Content-Type'] = 'text/plain'
	if n == 1 then
		ngx.say(tostring(...))
	else
		local t = {}
		for i=1,n do
			t[i] = tostring((select(i, ...)))
		end
		ngx.say(table.concat(t, '\t'))
	end
end

pp = require'pp'

_G.__index.print = print --override Lua's print() for pp.

--json API -------------------------------------------------------------------

local cjson = require'cjson'

function json(v)
	if type(v) == 'table' then
		return cjson.encode(v)
	elseif type(v) == 'string' then
		return cjson.decode(v)
	else
		error('invalid arg '..type(v))
	end
end

function out_json(v)
	ngx.header['Content-Type'] = 'application/json'
	ngx.say(cjson.encode(v))
	ngx.exit(0)
end

--buffered output for luapages template.
local outbuf
function out(s)
	outbuf = outbuf or {}
	outbuf[#outbuf+1] = s
end
function dump_outbuf()
	if not outbuf then return end
	ngx.say(table.concat(outbuf))
	outbuf = nil
end

--mustache template files  ---------------------------------------------------

local hige = require'hige'

function apply_template(name, data)
	local file = string.format('%s.%s.m', name, config'lang')
	local template = assert(glue.readfile('../www/'..file))
	return hige.render(template, data)
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

function str_arg(s)
	if not s then return end
	s = glue.trim(s)
	return s ~= '' and s or nil
end

function enum_arg(s, ...)
	for i=1,select('#',...) do
		if s == select(i,...) then
			return s
		end
	end
end

function clamp(x, min, max)
	return math.min(math.max(x, min), max)
end

function home_url(path)
	path = path or ''
	return (config'base_url' or ngx.var.scheme..'://'..ngx.var.host) .. path
end

function home_email(user)
	return string.format('%s@%s', user or 'admin', ngx.var.host)
end

check = assert

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

local lfs = require'lfs'

local function filepath(file, basedir)
	basedir = basedir or '../www'
	if file:find('..', 1, true) then return end --trying to escape
	if file:find'^_' then return end --private module
	local path = basedir .. '/' .. file
	if not lfs.attributes(path, 'mode') then return end
	return path
end

local chunks = {} --{action = chunk}

local lp = require'lp'

function action(action, ...)
	local chunk = chunks[action]
	if not chunk then
		local luapath = filepath(action..'.lua')
		local lppath = not luapath and filepath(action..'.lp')
		if not luapath and not lppath then
			ngx.redirect'/'
		end
		if lppath then
			lp.setoutfunc'out'
			local template = glue.readfile(lppath)
			chunk = lp.compile(template, action, _G)
		else
			chunk = assert(loadfile(luapath))
		end
		setfenv(chunk, getfenv(1))
		chunks[action] = chunk
	end
	local ret = chunk(...)
	dump_outbuf()
	return ret
end

--main -----------------------------------------------------------------------

local function check_img()
	local path = ngx.var.uri
	local kind = path:match'^/img/([^/]+)'
	if not kind then return end --not an image

	if kind == 'p' then

		if config('no_images') then
			error'no images'
		end

		--check for short form and make an internal redirect.
		local imgid, size = path:match'^/img/p/(%d+)-(%w+)%.jpg'
		if imgid then
			path = '/img/p'..imgid:gsub('.', '/%1')..'/'..imgid..'-'..size..'_default.jpg'
			ngx.header['Cache-Control'] = 'max-age='.. (24 * 3600)
			ngx.exec(path)
		end
		--redirect to default image (default is 302-moved-temporarily)
		local size = path:match'%-(%w+)_default.jpg$' or 'cart'
		ngx.redirect('/img/p/en-default-'..size..'_default.jpg')
	else
		--redirect to empty image (default is 302-moved-temporarily)
		ngx.redirect('/0.png')
	end
end

local function main()
	check_img()
	parse_request()
	local act, args = parse_path()
	act = act or 'browse'
	action(act, unpack(args))
end

return main
