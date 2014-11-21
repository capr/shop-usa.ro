
--cached config function.
local conf = {}
local null = conf
local function config(var, default)
	local val = conf[var]
	if val == nil then
		val = os.getenv(var:upper())
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

--global error handler: log or print the error.
local function try_call(func, ...)
	local function pass(ok, ...)
		if ok then return ... end
		local err = ...
		if config('hide_errors', false) then
			ngx.log(ngx.ERR, err)
			err = 'Internal error'
		end
		ngx.status = 500
		ngx.header.content_type = 'text/plain'
		ngx.say(err)
		ngx.exit(0)
	end
	return pass(xpcall(func, debug.traceback, ...))
end

--per-request memoization
local function once(f)
	return function()
		local v = ngx.ctx[f]
		if v == nil then
			v = f()
			ngx.ctx[f] = v
		end
		return v
	end
end

local g = require'_g'
g.config = config
g.once = once

local main = require'_main'
try_call(function()
	g.__index = _G
	main()
end)
