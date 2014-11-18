
check(POST)
local auth = json(POST.data)
local uid = login(auth)

local t = query1([[
	select
		u.firstname,
		u.lastname,
		u.email,
		u.emailvalid,
		u.pass is not null as haspass
	from
		usr u
	where
		u.active = 1
		and u.uid = ?
]], uid)

t.emailvalid = t.emailvalid == 1
t.haspass = t.haspass == 1

out_json(t)
