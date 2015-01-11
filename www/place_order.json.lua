require'promocode'

local shiptypes = {home = true, store = true}
local shiptype_strings = {home = 'Home', store = 'Store'}

--grab the order
local o = assert(json(POST.data))

--order anonymously, but at least grab a session first
local suid = allow(session_uid())

--sanitize and validate fields
local email     = assert(str_arg(o.email))
local name      = assert(str_arg(o.name))
local phone     = assert(str_arg(o.phone))
local addr      = assert(str_arg(o.addr))
local city      = assert(str_arg(o.city))
local county    = assert(str_arg(o.county))
local country   = 'Romania'
local note      = str_arg(o.note)
local shiptype  = assert(enum_arg(o.shiptype, 'home', 'store'))
local promocode = str_arg(o.promocode)

--slow down DoS bots. also, give the impression of doing hard work.
ngx.sleep(0.8)

--save the promocode, but only if set (do not clear it).
if promocode then
	save_promocode(promocode)
end

--add the order header.
local oid = iquery([[
	insert into ordr
		(uid, email, name, phone, addr, city, county, country, note,
			shiptype, shipcost, promocode, discount, status, mtime)
	values
		(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 'new', now())
]], uid(), email, name, phone, addr, city, county, country, note, shiptype,
	promocode)

--add the cart items at current price.
query([[
	insert into ordritem
		(oid, coid, qty, price, status, mtime)
	select
		?, ci.coid, ci.qty,
		$ronprice(pa.price, ?) as price, 'new', now()
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

--compute totals
local function compute_totals(oid, shiptype)
	local t = {}

	t.subtotal =
		tonumber(query1('select sum(price) from ordritem where oid = ?', oid))
	t.discount = promocode_discount(promocode)
	t.discamount = t.discount and math.ceil(t.subtotal * t.discount / 100) or 0
	t.disctotal = t.subtotal - t.discamount
	t.shipping = (shiptype ~= 'store' and t.disctotal < 300 and 25) or 0
	t.total = t.disctotal + t.shipping

	query([[
		update ordr set
			shipcost = ?,
			discount = ?
		where
			oid = ?
	]], t.shipping, t.discount, oid)

	return t
end

local totals = compute_totals(oid, shiptype)

--clear the cart.
query('delete from cartitem where buylater = 0 and uid = ?', uid())

--update user info, but only the fields that were missing.
query([[
	update usr set
		name = coalesce(name, ?),
		phone = coalesce(phone, ?)
	where
		uid = ?
]], name, phone, uid())

--send order email to client
local from = config'sales_email' or home_email(S('sales', 'sales'))

local subj = S('order_placed_subject', 'Order %s at %s')
local subj = string.format(subj, tostring(oid), config'shop_name' or home_domain())

local order = require'order'.get(oid)
order.shiptype = S('shiptype_'..shiptype, shiptype_strings[shiptype])
order.hasaddress = shiptype =='home'
glue.update(order, totals)

local msg = render('order_placed_email', order)

sendmail(from, email, subj, msg, 'html')

--return petty json
out(json{ok = true})
