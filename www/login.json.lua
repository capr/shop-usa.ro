
local action = _G[assert(enum_arg(... or 'login', 'login', 'logout'))]

local auth = POST and POST.data and json(POST.data)
local uid = allow(action(auth))

local t = query1([[
	select
		u.uid,
		u.email,
		u.name,
		u.phone,
		u.anonymous,
		u.facebookid,
		u.googleid,
		u.gimgurl
	from
		usr u
	where
		u.uid = ?
]], uid)

t.anonymous = t.anonymous == 1

t.buynow_count = tonumber(query1([[
	select count(1) from cartitem where uid = ? and buylater = 0
]], uid))

out(json(t))

