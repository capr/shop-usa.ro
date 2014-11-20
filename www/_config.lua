setfenv(1, require'_g')

local config = {}

function config.prod()
	db_host = '127.0.0.1'
	db_user = 'shop-usa'
	db_pass = require'_dbpass'
	db_name = 'prestashop'
end

function config.dev()
	db_host = '10.1.1.105'
	db_user = 'root'
	db_pass = 'abcd12'
	db_name = 'prestashop'
end

env = glue.readfile('../env')
config[env]()
