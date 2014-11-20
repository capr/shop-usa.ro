setfenv(1, require'_g')

local config = {}

facebook_app_id = '725102964211663'
facebook_app_secret = require'_facebook_secret'

google_client_id = '113821693132-an9cmghgm2fockigiubs1rp7tmfr9vnb.apps.googleusercontent.com'
google_client_secret = require'_google_secret'

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
