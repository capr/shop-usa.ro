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

session = once(function()
	return assert(session_.start())
end)

sessid = once(function()
	local session = session()
	local t = session.data
	if t.sessid then
		if not query1([[
			select 1 from session where sessid = ?
		]], t.sessid) then
			t.sessid = nil
		end
	end
	if not t.sessid then
		t.sessid = iquery([[
			insert into session (clientip) values (?)
		]], ngx.var.remote_addr)
		session:save()
	end
	return t.sessid
end)

uid = once(function()
	return query1('select uid from session where sessid = ?', sessid())
end)

cartid = once(function()
	local cartid = query1(
		'select cartid from cart where uid = ? or sessid = ?', uid(), sessid())
	if not cartid then
		cartid = iquery(
			'insert into cart (uid, sessid) values (?, ?)', uid(), sessid())
	end
	return cartid
end)

admin = once(function()
	return query1([[
		select u.admin from usr u
		inner join session s on u.uid = s.uid
		where s.sessid = ?
	]], sessid()) == 1
end)

editmode = admin

