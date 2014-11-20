local g = require'_g'

--cached config function.
local conf = {}
local null = conf
function g.config(var, default)
	local val = conf[var]
	if val == nil then
		val = os.getenv(val:upper())
		if val == nil then
			val = ngx.var[var]
			if val == nil then
				val = default
			end
		end
		conf[val] = val == nil and null or val
	end
	if val == null then
		return nil
	else
		return val
	end
end

--per-request memoization.
function g.once(f)
	return function()
		local v = ngx.ctx[f]
		if v == nil then
			v = f()
			ngx.ctx[f] = v
		end
		return v
	end
end

--global error handler: log or print the error.
local function try_call(func, ...)
	local function pass(ok, ...)
		if ok then return ... end
		local err = ...
		if config('print_errors', true) then
			ngx.log(ngx.ERR, err)
		else
			ngx.header.content_type = 'text/plain'
			ngx.say(err)
		else
		ngx.exit(500)
	end
	return pass(xpcall(func, debug.traceback, ...))
end

local function main()
	g.__index = _G --reassign _G because it is replaced on every request.
	g._G = g
	require'_main'()
end

try_call(main)

