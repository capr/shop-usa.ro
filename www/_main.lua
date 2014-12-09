setfenv(1, require'g')

--submodule API --------------------------------------------------------------

glue = require'glue'

--per-request memoization
local NIL = {}
local function enc(v) if v == nil then return NIL else return v end end
local function dec(v) if v == NIL then return nil else return v end end
function once(f)
	return function(k)
		local t = ngx.ctx[f]
		if not t then
			t = {}
			ngx.ctx[f] = t
		end
		local v = dec(t[enc(k)])
		if v == nil then
			v = f(k)
			t[enc(k)] = enc(v)
		end
		return v
	end
end

--load submodules

require'query'
require'sendmail'
require'session'
require'rates'

--request API ----------------------------------------------------------------

local function parse_request()
	GET = ngx.req.get_uri_args()
	local method = ngx.req.get_method()
	if method == 'POST' then
		ngx.req.read_body()
		POST = ngx.req.get_post_args()
	end
end

function lang()
	return GET.lang == 'en' and 'en' or 'ro'
end

function home_url(path)
	path = path or ''
	return (config'base_url' or ngx.var.scheme..'://'..ngx.var.host) .. path
end

function home_domain()
	return ngx.var.host
end

function home_email(user)
	return string.format('%s@%s', user or 'no-reply', home_domain())
end

function clientip()
	return ngx.var.remote_addr
end

function clamp(x, min, max)
	return math.min(math.max(x, min), max)
end

function uint_arg(s)
	local n = s and tonumber(s:match'(%d+)$')
	assert(not n or n >= 0)
	return n
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

function check(ret, err)
	if ret then return ret end
	ngx.status = 404
	if err then ngx.print(err) end
	ngx.exit(0)
end

function allow(ret, err)
	if ret then return ret, err end
	ngx.status = 403
	if err then ngx.print(err) end
	ngx.exit(0)
end

--output API -----------------------------------------------------------------

local outbufs = {}
local outbuf

function push_outbuf()
	outbuf = {}
	table.insert(outbufs, outbuf)
end

function pop_outbuf()
	if not outbuf then return end
	local s = table.concat(table.remove(outbufs))
	outbuf = outbufs[#outbufs]
	return s
end

function out(s)
	s = tostring(s)
	if outbuf then
		outbuf[#outbuf+1] = s
	else
		ngx.print(s)
	end
end

function setheader(header, val)
	if outbuf then return end
	ngx.header[header] = val
end

--print API ------------------------------------------------------------------

function print(...)
	setheader('Content-Type', 'text/plain')
	local n = select('#', ...)
	for i=1,n do
		out(tostring((select(i, ...))))
		if i < n then
			out'\t'
		end
	end
	out'\n'
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

--template API ---------------------------------------------------------------

local hige = require'hige'

function render(name, data)
	local file = string.format('%s.%s.m', name, lang())
	local template = assert(glue.readfile('../www/'..file))
	return hige.render(template, data)
end

--action API -----------------------------------------------------------------

local function parse_path() --path -> action, args
	local path = ngx.var.uri

	--split path
	local action, sargs = path:match'^/([^/]+)(/?.*)$' --action/sargs

	sargs = sargs or ''
	local args = {}

	--consider actions without file extension as args to the implicit app action.
	local ext = action and action:match'%.([^%.]+)$'
	if not ext then
		action, args[1] = 'app', action
	end

	--collect the rest of the args
	for s in sargs:gmatch'[^/]+' do
		args[#args+1] = s
	end

	return action, args
end

local lfs = require'lfs'

local function filepath(file) --file -> path (if exists)
	local basedir = '../www'
	if file:find('..', 1, true) then return end --trying to escape
	if file:find'^_' then return end --private module
	local path = basedir .. '/' .. file
	if not lfs.attributes(path, 'mode') then return end
	return path
end

local chunks = {} --{action = chunk}

local lp = require'lp'


local mime_types = {
	html = 'text/html',
	json = 'application/json',
}

function action(action, ...)

	--find the action.
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

	--set mime type based on action's file extension.
	local ext = action:match'%.([^%.]+)$'
	local mime = mime_types[ext]
	if mime then
		setheader('Content-Type', mime)
	end

	--execute the action.
	chunk(...)
end

--main -----------------------------------------------------------------------

local function check_img()
	local path = ngx.var.uri
	local kind = path:match'^/img/([^/]+)'
	if not kind then return end --not an image

	if kind == 'p' then

		check(not config('no_images'))

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

local function filter_lang(buf)
	local lang0 = lang()
	buf = buf:gsub('<t class=([^>]+)>(.-)</t>', function(lang, html)
		assert(not html:find('<t class=', 1, true), html)
		if lang ~= lang0 then
			return ''
		else
			return html
		end
	end)
	return buf
end

local function filter_comments(buf)
	return buf:gsub('<!%-%-.-%-%->', '')
end

local function main()
	check_img()
	parse_request()
	local act, args = parse_path()
	if act == 'app' then
		push_outbuf()
		action(act, unpack(args))
		local buf = pop_outbuf()
		buf = filter_lang(buf)
		buf = filter_comments(buf)
		out(buf)
	else
		action(act, unpack(args))
	end
end

return main
