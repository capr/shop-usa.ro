
local shiptypes = {home = true, store = true}

--grab the order
local o = assert(json(POST.data))

--order anonymously, but at least grab a session first
local suid = allow(session_uid())

--sanitize and validate fields
local email    = assert(str_arg(o.email))
local name     = assert(str_arg(o.name))
local phone    = assert(str_arg(o.phone))
local addr     = assert(str_arg(o.addr))
local city     = assert(str_arg(o.city))
local county   = assert(str_arg(o.county))
local country  = 'Romania'
local note     = str_arg(o.note)
local shiptype = assert(enum_arg(o.shiptype, 'home', 'store'))
local shipcost = shiptype == 'home' and 25 or 0

--TODO: check the total number of items and prices
--and fail to place the order if any of them is different.

--slow down DoS bots. also, give the impression of doing hard work.
ngx.sleep(0.8)

--add the order header.
local oid = iquery([[
	insert into ordr
		(uid, email, name, phone, addr, city, county, country, note,
			shiptype, shipcost, status)
	values
		(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
]], uid(), email, name, phone, addr, city, county, country, note,
	shiptype, shipcost)

--add the cart items at current price.
query([[
	insert into ordritem
		(oid, coid, qty, price, status)
	select
		?, ci.coid, ci.qty,
		$ronprice(pa.price, ?) as price, 'new'
	from
		cartitem ci
		inner join ps_product_attribute pa
			on pa.id_product_attribute = ci.coid
		inner join ps_product p
			on p.id_product = ci.pid
	where
		ci.buylater = 0
		and p.active = 1
		and ci.uid = ?
]], oid, usd_rate(), uid())

--clear the cart.
query('delete from cartitem where buylater = 0 and uid = ?', uid())

--update user info
query([[
	update usr set
		name = coalesce(name, ?),
		phone = coalesce(phone, ?)
	where
		uid = ?
]], name, phone, uid())

out(json{ok = true})
