
local t = query1([[
	select
		u.firstname,
		u.lastname,
		u.email,
		u.anonymous,
		u.facebookid
	from
		usr u
	where
		u.uid = ?
]], uid())

t.anonymous = t.anonymous == 1

out_json(t)
