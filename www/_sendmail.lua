setfenv(1, require'g')
require'resty_socket'
local smtp = require'socket.smtp'
local mime = require'mime'
local ltn12 = require'ltn12'

local function strip_name(email)
	return '<'..(email:match'<(.-)>' or email)..'>'
end

function sendmail(from, rcpt, subj, msg)
	pp({
		headers = {
			from = from,
			to = rcpt,
			subject = subj,
		},
		body = mime.eol(0, msg),
	})
	pp({
		from   = strip_name(from),
		rcpt   = strip_name(rcpt),
		server = config('smtp_host', '127.0.0.1'),
		port   = config('smtp_port', 25),
	})

	local source = smtp.message{
		headers = {
			from = from,
			to = rcpt,
			subject = subj,
		},
		body = mime.eol(0, msg),
	}
	assert(smtp.send{
		from   = strip_name(from),
		rcpt   = strip_name(rcpt),
		source = source,
		server = config('smtp_host', '127.0.0.1'),
		port   = config('smtp_port', 25),
	})
end

