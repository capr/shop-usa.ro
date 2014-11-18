
local t = query1([[
	select
		u.firstname,
		u.lastname,
		u.email,
		case when u.emailvalid = 0 and u.pass is null then 1 else 0 end as anonymous,
		u.facebookid
	from
		usr u
	where
		u.active = 1
		and u.uid = ?
]], uid())

t.anonymous = t.anonymous == 1

out_json(t)
