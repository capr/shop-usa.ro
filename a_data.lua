local cjson = require'cjson'

return function()
	local m = table.remove(args, 1)
	local f = require('d_'..m)
	local t = f()
	print'/*'; pp(t); print'*/\n'
	local j = cjson.encode(t)
	print(j)
end
