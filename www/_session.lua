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

--session cookie -------------------------------------------------------------

session = once(function()
	session_.cookie.persistent = true
	session_.check.ssi = false --ssi will change after browser closes
	session_.check.ua = false  --user could upgrade the browser
	session_.cookie.lifetime = 2 * 365 * 24 * 3600 --2 years
	return assert(session_.start())
end)

local function session_uid()
	return session().data.uid
end

local function save_uid(uid)
	assert(uid)
	local session = session()
	if uid ~= session.data.uid then
		session.data.uid = uid
		session:save()
	end
end

--facebook graph requests ----------------------------------------------------

local function facebook_graph_request(url, args)
	local res = ngx.location.capture('/graph.facebook.com'..url, {args = args})
	if res and res.status == 200 then
		return json(res.body)
	else
		ngx.log(ngx.ERR, 'facebook_graph_request: ',
			url, ' ', pp.format(args, ' '), ' -> ', pp.format(res, ' '))
	end
end

local function facebook_validate(auth)
	local t = facebook_graph_request('/debug_token', {
		input_token = auth.accesstoken,
		access_token = facebook_app_id..'|'..facebook_app_secret,
	})
	local ok = t and t.data and t.data.is_valid
		and t.data.app_id == facebook_app_id
	if not ok then
		ngx.log(ngx.ERR, 'facebook_validate: ', pp.format(auth, ' '), ' -> ',
			pp.format(t, ' '))
	end
	return ok
end

--google requests ------------------------------------------------------------

local function google_api_request(url, args, auth_header)
	local res = ngx.location.capture('/content.googleapis.com'..url, {
		args = args,
		vars = {authorization_header = auth_header},
	})
	if res and res.status == 200 then
		return json(res.body)
	else
		ngx.log(ngx.ERR, 'google_api_request: ',
			url, ' ', 'auth_header=', auth_header, '; ',
			pp.format(args, ' '), ' -> ', pp.format(res, ' '))
	end
end

local function google_validate(auth)
	local t = google_api_request('/plus/v1/people/me', nil, 'Bearer '..auth.accesstoken)
	pp(t)
end

--authentication -------------------------------------------------------------

local auth = {} --auth.<type>(auth) -> uid, can_create

local function valid_uid(uid)
	return uid and query1('select uid from usr where uid = ?', uid)
end

local function anonymous_uid(uid)
	return uid and query1('select uid from usr where uid = ? and anonymous = 1', uid)
end

local function create_user()
	return iquery('insert into usr (clientip) values (?)', ngx.var.remote_addr)
end

function auth.session()
	return valid_uid(session_uid()) or create_user()
end

local function encrypt_pass(pass)
	return ngx.encode_base64(ngx.sha1_bin(pass))
end

local function pass_uid(email, pass)
	return query1('select uid from usr where email = ? and pass = ?',
		email, encrypt_pass(pass))
end

local function email_exists(email)
	return query1('select 1 from usr where email = ? and pass is not null', email)
end

local function set_email_pass(uid, email, pass)
	return iquery([[
		update usr set
			anonymous = 0,
			emailvalid = 0,
			email = ?,
			pass = ?
		where
			uid = ?
	]], email, encrypt_pass(pass), uid)
end

local function delete_user(uid)
	query('delete from usr where uid = ?', uid)
end

local function transfer_cart(old_uid, new_uid)
	query('update cartitem set uid = ? where uid = ?', new_uid, old_uid)
end

function auth.pass(auth)
	if auth.action == 'login' then
		return pass_uid(auth.email, auth.pass)
	elseif auth.action == 'create' then
		if not email_exists(auth.email) then
			local uid = anonymous_uid(session_uid()) or create_user()
			set_email_pass(uid, auth.email, auth.pass)
			return uid
		end
	end
end

local function facebookid_uid(facebookid)
	return query1('select uid from usr where facebookid = ?', facebookid)
end

function auth.facebook(auth)
	if facebook_validate(auth) then
		local uid =
			facebookid_uid(auth.facebookid)
			or anonymous_uid(session_uid())
			or create_user()
		query([[
			update usr set
				anonymous = 0,
				emailvalid = 1,
				email = ?,
				facebookid = ?,
				firstname = ?,
				lastname = ?,
				gender = ?
			where
				uid = ?
		]], auth.email, auth.facebookid, auth.firstname, auth.lastname,
			auth.gender, uid)
		return uid
	end
end

function auth.google(auth)
	if google_validate(auth) then

	end
end

function authenticate(a)
	return auth[a and a.type or 'session'](a)
end

function login(auth)
	local uid = authenticate(auth)
	local suid = valid_uid(session_uid())
	if uid then
		if uid ~= suid then
			if suid then
				transfer_cart(suid, uid)
				if anonymous_uid(suid) then
					delete_user(suid)
				end
			end
			save_uid(uid)
		end
	end
	return uid
end

uid = once(login) --TODO: reset cache when suid changes

admin = once(function() --TODO: same here
	return query1([[
		select 1 from usr u where u.uid = ? and u.admin = 1
	]], uid()) ~= nil
end)

editmode = admin

