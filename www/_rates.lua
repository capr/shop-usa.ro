setfenv(1, require'g')

usd_rate = once(function()
	return query1[[
		select ron from convrate
		where usd = 1 and date <= now()
		order by date desc limit 1
	]] or '4.00'
end)

--sql macro to be used in conjuction with usd_rate() to give the price in RON.
function qmacro.ronprice(col, rate)
	return string.format('cast(round((%s) * 1.50 * (%s), -1) - 1 as decimal(20, 0))', col, rate)
end

--TODO: move this...
function qmacro.timeago(col)
	return string.format('timestampdiff(second, (%s), now())', col)
end
