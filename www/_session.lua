setfenv(1, require'g')
local random_string = require'resty_random'
local session_ = require'resty_session'

local function fullname(firstname, lastname)
	return glue.trim((firstname or '')..' '..(lastname or ''))
end

local function salted_hash(token, salt)
	token = ngx.hmac_sha1(check(salt), check(token))
	return glue.tohex(token) --40 bytes
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
	local session = session()
	if uid ~= session.data.uid then
		session.data.uid = uid
		session:save()
	end
end

--authentication frontend ----------------------------------------------------

local auth = {} --auth.<type>(auth) -> uid, can_create

function authenticate(a)
	return auth[a and a.type or 'session'](a)
end

--session-cookie authentication ----------------------------------------------

local function valid_uid(uid)
	return uid and query1('select uid from usr where uid = ?', uid)
end

local function anonymous_uid(uid)
	return uid and query1('select uid from usr where uid = ? and anonymous = 1', uid)
end

local function create_user()
	ngx.sleep(0.2) --make filling it up a bit harder
	return iquery('insert into usr (clientip) values (?)', ngx.var.remote_addr)
end

function auth.session()
	return valid_uid(session_uid()) or create_user()
end

--anonymous authentication ---------------------------------------------------

function auth.anonymous()
	return anonymous_uid(session_uid()) or create_user()
end

--password authentication ----------------------------------------------------

local function pass_hash(pass)
	return salted_hash(pass, check(config'pass_salt'))
end

local function pass_uid(email, pass)
	ngx.sleep(0.2) --make brute-forcing a bit harder
	return query1('select uid from usr where email = ? and pass = ?',
		email, pass_hash(pass))
end

local function pass_email_uid(email)
	return query1('select uid from usr where email = ? and pass is not null', email)
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
	]], glue.trim(email), pass_hash(pass), uid)
end

local function delete_user(uid)
	query('delete from usr where uid = ?', uid)
end

local function transfer_cart(old_uid, new_uid)
	query('update cartitem set buylater = 1 where uid = ?', new_uid)
	query('update cartitem set uid = ? where uid = ?', new_uid, old_uid)
end

function auth.pass(auth)
	if auth.action == 'login' then
		return pass_uid(auth.email, auth.pass)
	elseif auth.action == 'create' then
		if not auth.email or #glue.trim(auth.email) < 1 then return end
		if not auth.pass or #auth.pass < 1 then return end
		if not pass_email_uid(auth.email) then
			local uid = anonymous_uid(session_uid()) or create_user()
			set_email_pass(uid, auth.email, auth.pass)
			return uid
		end
	end
end

--one-time token authentication ----------------------------------------------

local token_lifetime = config('pass_token_lifetime', 3600)

local function gen_token(uid)

	--now it's a good time to garbage-collect expired tokens
	query('delete from usrtoken where atime < now() - ?', token_lifetime)

	--check if too many tokens were requested
	local n = query1([[
		select count(1) from usrtoken where
			uid = ? and atime > now() - ?
	]], uid, token_lifetime)
	assert(tonumber(n) <= config('pass_token_maxcount', 3), 'too many active tokens')

	ngx.sleep(math.random(0.8, 1.4)) --make time analysis a bit harder
	local token = pass_hash(random_string(32))

	--add the token to db (break on collisions)
	query('insert into usrtoken (token, uid) values (?, ?)',
		pass_hash(token), uid)

	return token
end

function send_auth_token(email)
	--find the user with this email
	local uid = pass_email_uid(email)
	if not uid then return end

	--generate a new token for this user if we can
	local token = gen_token(uid)
	if not token then return end

	--send it to the user
	local subj = S('reset_pass_subject', 'Your reset password link')
	local msg = apply_template('reset_pass_email', {
		url = home_url('/reset_pass/'..token),
	})
	local from = config'noreply_email' or home_email()
	sendmail(from, email, subj, msg)
end

local function token_uid(token)
	return query1([[
		select uid from usrtoken where token = ? and atime > now() - ?
	]], pass_hash(token), token_lifetime)
end

function auth.token(auth)
	ngx.sleep(0.2) --make brute forcing a bit harder

	--find the user
	local uid = token_uid(auth.token)
	if not uid then return end

	--remove the token (it's single use)
	query('delete from usrtoken where token = ?', token)

	return uid
end

--facebook authentication ----------------------------------------------------

local function facebook_uid(facebookid)
	return query1('select uid from usr where facebookid = ?', facebookid)
end

local function facebook_graph_request(url, args)
	local res = ngx.location.capture('/graph.facebook.com'..url, {args = args})
	if res and res.status == 200 then
		local t = json(res.body)
		if t and not t.error then
			return t
		end
	end
	ngx.log(ngx.ERR, 'facebook_graph_request: ', url, ' ',
		pp.format(args, ' '), ' -> ', pp.format(res, ' '))
end

function auth.facebook(auth)
	--get info from facebook
	local t = facebook_graph_request('/v2.1/me',
		{access_token = auth.access_token})
	if not t then return end

	--grab a uid
	local uid =
		facebook_uid(t.id)
		or anonymous_uid(session_uid())
		or create_user()

	--deanonimize user and update its info
	query([[
		update usr set
			anonymous = 0,
			emailvalid = 1,
			email = ?,
			facebookid = ?,
			name = ?,
			gender = ?
		where
			uid = ?
	]], t.email, t.id, fullname(t.first_name, t.last_name), t.gender, uid)

	return uid
end

--google+ authentication -----------------------------------------------------

local function google_uid(googleid)
	return query1('select uid from usr where googleid = ?', googleid)
end

local function google_api_request(url, args)
	local res = ngx.location.capture('/content.googleapis.com'..url, {args = args})
	if res and res.status == 200 then
		return json(res.body)
	end
	ngx.log(ngx.ERR, 'google_api_request: ', url, ' ',
		pp.format(args, ' '), ' -> ', pp.format(res, ' '))
end

function auth.google(auth)
	--get info from google
	local t = google_api_request('/plus/v1/people/me',
		{access_token = auth.access_token})
	if not t then return end

	--grab a uid
	local uid =
		google_uid(t.id)
		or anonymous_uid(session_uid())
		or create_user()

	--deanonimize user and update its info
	query([[
		update usr set
			anonymous = 0,
			emailvalid = 1,
			email = ?,
			googleid = ?,
			gimgurl = ?,
			name = ?
		where
			uid = ?
	]], t.emails and t.emails[1] and t.emails[1].value,
		t.id,
		t.image and t.image.url,
		t.name and fullname(t.name.givenName, t.name.familyName),
		uid)

	return uid
end

--authentication logic -------------------------------------------------------

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
			assert(uid)
			save_uid(uid)
		end
	end
	return uid
end

uid = once(login) --TODO: reset cache when suid changes

function logout()
	save_uid(nil)
	return authenticate()
end

admin = once(function() --TODO: same here
	return query1([[
		select 1 from usr u where u.uid = ? and u.admin = 1
	]], uid()) ~= nil
end)

editmode = admin

