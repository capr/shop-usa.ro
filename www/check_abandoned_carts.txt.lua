require'promocode'

for i,u in ipairs(query([[
	select
		u.uid,
		u.email,
		u.name
	from
		usr u
	where
		u.anonymous = 0
		and u.active = 1
		and u.email is not null
		and timestampdiff(hour, u.atime, now()) > ?
		and u.codesent = 0
		and exists
			(select 1 from cartitem ci where ci.uid = u.uid and ci.buylater = 0)
]], config('abandoned_cart_wait_hours', 48))) do
	local promocode = gen_promocode(u.uid)
	if promocode then
		local from = config'sales_email' or home_email(S('sales', 'sales'))
		local msg = render('abandoned_cart_email', {
			name = u.name,
			promocode = promocode,
			sales_email = from,
		})
		sendmail(from, u.email, subj, msg)
		query('update usr set codesent = 1 where uid = ?', u.uid)
		print(u.email, u.name, promocode)
	end
end

