
local auth = POST and json(POST.data)
local uid = login(auth) or ngx.exit(ngx.HTTP_FORBIDDEN)

local t = query1([[
	select
		u.uid,
		u.firstname,
		u.lastname,
		u.email,
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

out_json(t)
