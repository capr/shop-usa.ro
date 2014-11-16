setfenv(1, require'_g')

local config = {}

function config.prod()
	db_host = '127.0.0.1'
	db_user = 'shop-usa'
	db_pass = require'_dbpass'
	db_name = 'prestashop'
end

local env = require'_env'
config[env]()
