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
	session_.cookie.persistent = true
	session_.cookie.secure = false
	session_.check.ssi = false --ssi will change after browser closes
	session_.check.ua = false  --user could upgrade the browser
	session_.cookie.lifetime = 2 * 365 * 24 * 3600 --2 years
	return assert(session_.start())
end)

local auth = {}

function auth.session()
	local uid = session().data.uid
	return query1('select 1 from usr where uid = ?', uid) and uid or nil
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

local function delete_user(uid)
	query('delete from usr where uid = ?', uid)
end

local function transfer_cart(old_uid, new_uid)
	query('update cartitem set uid = ? where uid = ?', new_uid, old_uid)
end

local function set_valid_email(uid, email)
	query('update usr set email = ?, emailvalid = 1 where uid = ?', email, uid)
end

local function set_email_pass(uid, email, pass)
	query('update usr set email = ?, emailvalid = 0, pass = ? where uid = ?',
		email, pass, uid)
end

local function is_anonymous(uid)
	return query1([[
		select 1 from usr where
			pass is null and not emailvalid and uid = ?
	]], uid) ~= nil
end

local function save_user(uid)
	local session = session()
	session.data.uid = uid
	session:save()
end

function login(auth)
	auth = auth or {}
	local uid = authenticate(auth)
	local suid = authenticate()
	if not uid then
		if auth.login_only then return end
		uid = suid or create_user()
	else
		if auth.create_only then return end
		if suid and uid ~= suid then
			if auth.transfer_cart then
				transfer_cart(suid, uid)
			end
			if is_anonymous(suid) then
				delete_user(suid)
			end
		end
	end
	if uid then
		if auth.type == 'pass' and auth.create_only then
			set_email_pass(uid, auth.email, auth.pass)
		else
			set_valid_email(uid, auth.email)
		end
		if uid ~= suid then
			save_user(uid)
		end
	end
	return uid
end

uid = once(login)

admin = once(function()
	return query1([[
		select 1 from usr u where u.uid = ? and u.admin = 1
	]], uid()) ~= nil
end)

editmode = admin
