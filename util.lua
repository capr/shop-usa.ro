local ppm = require'pp'

function print(...)
	local t = {}
	for i=1,select('#',...) do
		t[i] = tostring((select(i, ...)))
	end
	ngx.header.content_type = 'text/plain'
	ngx.say(table.concat(t, '\t'))
end

function pp(v)
	print(ppm.format(v, '   '))
end

