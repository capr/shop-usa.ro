
local uid
if ... == 'logout' then
	uid = allow(logout())
else
	local auth = POST and POST.data and json(POST.data)
	uid = allow(login(auth))
end

local t = query1([[
	select
		u.uid,
		u.email,
		u.name,
		u.phone,
		u.anonymous,
		u.facebookid,
		u.googleid,
		u.gimgurl,
		if(u.pass is not null, 1, 0) as haspass,
		u.admin
	from
		usr u
	where
		u.uid = ?
]], uid)

t.anonymous = t.anonymous == 1
t.haspass = tonumber(t.haspass) == 1
t.admin = t.admin == 1

t.buynow_count = tonumber(query1([[
	select count(1) from cartitem where uid = ? and buylater = 0
]], uid))

out(json(t))

