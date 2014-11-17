setfenv(1, require'_g')
require'_query'
local session_ = require'_resty_session'

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
	session_.persistent = true
	session_.cookie.secure = false
	session_.check.ssi = false --ssi will change after browser closes
	session_.check.ua = false  --user could upgrade the browser
	session_.cookie.lifetime = 2 * 365 * 24 * 3600 --2 years
	return assert(session_.start())
end)

local function authenticate(auth)
	return query1([[
		select
			u.uid
		from
			usr u
		where
			u.pass = ?
			or u.facebookid = ?
			or u.googleid = ?
			or u.twitterid = ?
		]],
		auth.pass,
		auth.facebookid,
		auth.googleid,
		auth.twitterid)
end

local function validate_uid(uid)
	return query1('select uid from usr where uid = ?', uid)
end

local function create_user()
	return iquery([[
		insert into usr (clientip) values (?)
	]], ngx.var.remote_addr)
end

local function anonymous(uid)
	return query1([[
		select 1 from usr where
			pass is null and not emailvalid and uid = ?
	]], uid) == 1
end

local function transfer_user(old_uid, new_uid)
	query('update cartitem set uid = ? where uid = ?', new_uid, old_uid)
	query('delete from usr where uid = ?', old_uid)
end

function login(auth)
	local session = session()
	local uid =
		auth and login(auth)
		or validate_uid(session.data.uid)
		or create_user()

	--save the new uid if different from the current one
	if uid ~= session.data.uid then
		if session.data.uid and anonymous(session.data.uid) then
			transfer_user(session.data.uid, uid)
		end
		session.data.uid = uid
		session:save()
	end

	return uid
end

uid = once(login)

admin = once(function()
	return query1([[
		select u.admin from usr u where u.uid = ?
	]], uid()) == 1
end)

editmode = admin
