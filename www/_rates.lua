setfenv(1, require'_g')

usd_rate = once(function()
	return query1[[
		select ron from convrate
		where usd = 1 and date <= now()
		order by date desc limit 1
	]]
end)

