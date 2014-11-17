setfenv(1, require'_g')
require'_query'
local session_ = require'resty.session'

function once(f) --per-request memoization
	return function()
		local v = REQ[f]
		if v == nil then
			v = f()
			REQ[f] = v
		end
		return v
	end
end

--session state --------------------------------------------------------------

local session = once(function()
	session_.persistent = true
	session_.cookie.lifetime = 365 * 24 * 3600 --one year
	return assert(session_.start())
end)

uid = once(function()
	local session = session()
	local t = session.data
	if t.uid then
		if not query1([[
			select 1 from usr where uid = ?
		]], t.uid) then
			t.uid = nil
		end
	end
	if not t.uid then
		t.uid = iquery([[
			insert into usr (clientip) values (?)
		]], ngx.var.remote_addr)
		session:save()
	end
	return t.uid
end)

admin = once(function()
	return query1([[
		select u.admin from usr u where u.uid = ?
	]], uid()) == 1
end)

editmode = admin
