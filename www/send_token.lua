local email = assert(json(POST.data).email)
send_auth_token(email)