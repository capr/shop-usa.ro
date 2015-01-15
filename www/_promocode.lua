setfenv(1, require'g')

local random_string = require'resty_random'

function promocode_data(promocode)
	if not promocode then return end
	return query1([[
		select
			c.discount,
			$timeago(c.expires) as expires_ago
		from
			promocode c
		where
			$timeago(c.expires) < 0
			and c.promocode = ?
	]], promocode)
end

function load_promocode()
	return query1('select u.promocode from usr u where u.uid = ?', uid())
end

function save_promocode(promocode)
	promocode = str_arg(promocode)
	if promocode then
		promocode = promocode:upper()
	end
	query('update usr set promocode = ? where uid = ?', promocode, uid())
end

local function cleanup()
	query'delete from promocode where $timeago(expires) > 0'
end

local function gencode()
	return glue.tohex(random_string(4), 'uppercase')
end

local max_tries = 10

function gen_promocode(uid)
	cleanup()
	for _ = 1, max_tries do
		local code = gencode()
		local res = query([[
			insert ignore into promocode
				(promocode, expires, discount, reason, uid)
			values
				(?, date_add(now(), interval 1 day), 5, 'abandoned cart', ?)
		]], code, uid)
		if res.affected_rows == 1 then
			return code
		end
	end
end

