local pass = assert(json(POST.data).pass)
set_pass(pass)
out(json{ok = true}) --print a dummy json so that the ajax call doesn't fail.
