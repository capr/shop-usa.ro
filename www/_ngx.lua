
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

	--reassign _G to G because it is replaced on every request
	local G = require'_g'
	G.__index = _G

	--unload packages that we work on
	package.loaded._main = nil

	require'_main'()
end

try_call(main)
