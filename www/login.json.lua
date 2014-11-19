
local auth = POST and json(POST.data)
local uid = login(auth)

local t = {success = uid ~= nil, uid = uid}

if uid then
	glue.update(t, query1([[
		select
			u.firstname,
			u.lastname,
			u.email,
			u.anonymous,
			u.facebookid,
			u.googleid,
		from
			usr u
		where
			u.uid = ?
	]], uid))
	t.anonymous = t.anonymous == 1
end

out_json(t)
