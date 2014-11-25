local pass = assert(json(POST.data).pass)
local uid = assert(session_uid())
set_pass(uid, pass)
