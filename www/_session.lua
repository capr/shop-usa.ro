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

local auth = {}

function auth.session()
	local uid = session().data.uid
	return query1('select 1 from usr where uid = ?', uid) == 1 and uid
end

function auth.pass(auth)
	return query1('select uid from usr where email = ? and pass = ?',
		auth.email, auth.pass)
end

function auth.facebook(auth)
	return query1('select uid from usr where facebookid = ?', auth.facebookid)
end

function authenticate(a)
	return auth[a and a.type or 'session'](a)
end

local function create_user()
	return iquery([[
		insert into usr (clientip) values (?)
	]], ngx.var.remote_addr)
end

local function transfer_user(old_uid, new_uid)
	query('update cartitem set uid = ? where uid = ?', new_uid, old_uid)
	query('delete from usr where uid = ?', old_uid)
end

local function set_valid_email(uid, email)
	query('update usr set email = ?, emailvalid = 1 where uid = ?', uid, email)
end

local function set_email_pass(uid, email, pass)
	query('update usr set email = ?, emailvalid = 0, pass = ? where uid = ?',
		email, pass, uid)
end

local function update_user(uid, auth)
	if auth.emailvalid then
		set_valid_email(uid, auth.email)
	end
	if auth.emailpass then
		set_email_pass(uid, auth.email, auth.pass)
	end
end

local function is_anonymous(uid)
	return query1([[
		select 1 from usr where
			pass is null and not emailvalid and uid = ?
	]], uid) == 1
end

local function save_user(uid)
	session.data.uid = uid
	session:save()
end

function login(auth)
	assert(auth.type == 'pass')
	local uid = auth.pass(auth)
	if not uid then return end
	if suid and uid ~= suid and is_anonymous(suid) then
		transfer_user(suid, uid)
	end
	if uid ~= suid then
		save_user(uid)
	end
end

function create_account(auth)
	assert(auth.type == 'pass')
	local uid = auth.pass(auth)
	if not uid then
		uid = suid or (auth.create and create_user())
	elseif suid and uid ~= suid and is_anonymous(suid) then
		transfer_user(suid, uid)
	end
	if uid then
		update_user(uid, auth)
		if uid ~= suid then
			save_user(uid)
		end
	end
	local uid = create_account()
	set_email_pass(uid, auth.email, auth.pass)
	save_user(uid)
end

function login(auth)
	local uid = authenticate(auth)
	local suid = auth.session()
	if not uid then
		uid = suid or (auth.create and create_user())
	elseif suid and uid ~= suid and is_anonymous(suid) then
		transfer_user(suid, uid)
	end
	if uid then
		update_user(uid, auth)
		if uid ~= suid then
			save_user(uid)
		end
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
