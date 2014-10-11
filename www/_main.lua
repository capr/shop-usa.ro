setfenv(1, require'_g')
local glue = require'glue'
local lp = require'_lp'
local lfs = require'lfs'
local cjson = require'cjson'
local pp_ = require'pp'
--package.loaded._query = nil
require'_query'

--print API ------------------------------------------------------------------

function print(...)
	local t = {}
	for i=1,select('#',...) do
		t[i] = tostring((select(i, ...)))
	end
	ngx.header.content_type = 'text/plain'
	ngx.say(table.concat(t, '\t'))
end

function pp(v)
	print(pp_.format(v, '   '))
end

function out_json(t)
	ngx.header.content_type = 'application/json'
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

--reply API ------------------------------------------------------------------

function not_found(what)
	ngx.status = 404
	ngx.header.content_type = 'text/plain'
	print(msg or (what and what .. ' ' or '' ) .. 'not found')
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

local function filepath(file)
	if file:find('..', 1, true) then return end --trying to escape
	if file:find'^_' then return end --private module
	local path = '../www/'..file
	if not lfs.attributes(path, 'mode') then return end
	return path
end

function action(action, ...)
	local luapath = filepath(action..'.lua')
	local lppath = not luapath and filepath(action..'.lp')
	if not luapath and not lppath then
		ngx.redirect'/'
	end
	local chunk
	if lppath then
		lp.setoutfunc'ngx.say'
		local template = glue.readfile(lppath)
		chunk = lp.compile(template, action, _G)
	else
		chunk = assert(loadfile(luapath))
	end
	setfenv(chunk, getfenv(1))
	return chunk(...)
end

--main -----------------------------------------------------------------------

local function check_img()
	local path = ngx.var.uri
	if not path:find'^/img/p/%d' then return end
	local size = path:match'%-(%w+)_default.jpg$'
	if not size then return end
	if filepath(path) then return end
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

--http://10.1.1.105:8080/img/p/2/0/0/0/1/0/1/4/3/6/0/1/0/1/20001014360101-cart_default.jpg
