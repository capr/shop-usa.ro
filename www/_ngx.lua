
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

	local _G = _G
	setfenv(1, require'_g')
	__index = _G --reassign _G because it is replaced on every request.

	require'_main'()
end

try_call(main)

