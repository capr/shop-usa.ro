
local action = ... or 'login'
local actions = {login = login, logout = logout}
action = check(actions[action])

local auth = POST and POST.data and json(POST.data)
local uid = action(auth) or ngx.exit(ngx.HTTP_FORBIDDEN)

local t = query1([[
	select
		u.uid,
		u.email,
		u.anonymous,
		u.name,
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
