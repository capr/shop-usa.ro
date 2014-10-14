
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

	--reassign _G to G because it is replaced on every request.
	local G = require'_g'
	G.__index = _G
	setfenv(1, G)

	nocache = true

	--unload packages if not using cache.
	if nocache then
		package.loaded._main = nil
		package.loaded._query = nil
		package.loaded._lp = nil
	end

	require'_main'()
end

try_call(main)
