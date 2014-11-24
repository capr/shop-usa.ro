
local shiptypes = {home = true, store = true}

--grab the order
local o = check(POST and POST.data and json(POST.data))

--order anonymously, but at least grab a session first
local suid = check(session_uid())

--sanitize and validate fields
local email    = check(str_arg(o.email))
local name     = check(str_arg(o.name))
local phone    = check(str_arg(o.phone))
local addr     = check(str_arg(o.addr))
local city     = check(str_arg(o.city))
local county   = check(str_arg(o.county))
local country  = 'Romania'
local note     = check(str_arg(o.note))
local shiptype = check(enum_arg(o.shiptype, 'home', 'store'))
local shipcost = shiptype == 'home' and 25 or 0

--TODO: check the total number of items and prices
--and fail to place the order if any of them is different.

--slow down DoS bots. also, give the impression of doing hard work.
ngx.sleep(0.8)

--add the order header.
local oid = iquery([[
	insert into ordr
		(uid, email, name, phone, addr, city, county, country, note,
			shiptype, shipcost)
	values
		(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
]], uid(), email, name, phone, addr, city, county, country, note,
	shiptype, shipcost)

--add the cart items at current price.
query([[
	insert into ordritem
		(oid, coid, qty, price)
	select
		?, ci.coid, ci.qty,
		$ronprice(pa.price, ?) as price,
	from
		cartitem ci
		inner join product_attribute pa
			on pa.id_product_attribute = ci.coid
	where
		ci.buylater = 0
		and ci.uid = ?
]], oid, uid())

--clear the cart.
query('delete from cartitem where buylater = 0 and uid = ?', uid())

