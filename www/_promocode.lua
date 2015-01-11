setfenv(1, require'g')

function promocode_discount(promocode)
	if not promocode then return end
	return query1([[
		select c.discount from promocode c where
			timestampdiff(second, c.expires, now()) > 0
			and c.promocode = ?
	]], promocode)
end

function load_promocode()
	return query1('select u.promocode from usr u where u.uid = ?', uid())
end

function save_promocode(promocode)
	promocode = str_arg(promocode)
	query('update usr set promocode = ? where uid = ?', promocode, uid())
end

