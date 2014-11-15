
local function try_call(func, ...)
	local function pass(ok, ...)
		if ok then return ... end
		ngx.status = 500
		ngx.header.content_type = 'text/plain'
		ngx.say((...))
		ngx.exit(0)
	end
	return pass(xpcall(func, debug.traceback, ...))
end

local function main()

	local g = require'_g'
	g.__index = _G --reassign _G because it is replaced on every request.
	g._G = g
	g.REQ = _G --per-request storage
	setfenv(1, g)

	require'_main'()
end

try_call(main)

