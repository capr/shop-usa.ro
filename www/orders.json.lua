
query([[
select
from orders

query([[
	insert into ordritem
		(oid, coid, qty, price)
	select
		?, ci.coid, ci.qty,
		$ronprice(pa.price, ?) as price
	from
		cartitem ci
		inner join ps_product_attribute pa
			on pa.id_product_attribute = ci.coid
	where
		ci.buylater = 0
		and ci.uid = ?
]], oid, usd_rate(), uid())

--clear the cart.
query('delete from cartitem where buylater = 0 and uid = ?', uid())

out(json{ok = true})

