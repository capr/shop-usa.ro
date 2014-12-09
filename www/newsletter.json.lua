
local t = json(POST.data)
local action = assert(str_arg(t.action))
local email = assert(str_arg(t.email))

if action == 'subscribe' then
	query([[
		insert into nlemail (email, clientip, mtime) values (?, ?, now())
		on duplicate key update clientip = ?, mtime = now()
	]], email, clientip(), clientip())
elseif action == 'unsubscribe' then
	query('delete from nlemail where email = ?', email)
else
	error'invalid action'
end

out(json{ok = true})
