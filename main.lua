--action dispatcher and fallback error handler.

local default_action = 'browse'
args = nil
kvargs = nil

function try_call(func, ...)
	local function pass(ok, ...)
		if ok then return ... end
		ngx.status = 500
		ngx.header.content_type = 'text/plain'
		print(...)
		ngx.exit(0)
	end
	return pass(xpcall(func, debug.traceback, ...))
end

function not_found(what)
	if what == 'action' then
		ngx.redirect'/'
	end
	ngx.status = 404
	ngx.header.content_type = 'text/plain'
	print(msg or (what and what .. ' ' or '' ) .. 'not found')
	ngx.exit(0)
end

function try_load(mod)
	if not package.searchpath(mod, package.path) then
		not_found'action'
	else
		require(mod)()
	end
end

try_call(function()
	require'util'
	require'db'

	--parse action
	local path = ngx.var.uri
	local act, sargs = path:match'^/([^/]+)(/?.*)$'
	act = act or default_action
	sargs = sargs or ''

	--parse args and kvargs
	args = {}
	for s in sargs:gmatch'[^/]+' do
		args[#args+1] = s
	end
	kvargs = ngx.req.get_uri_args()

	try_load('a_'..act)
end)

