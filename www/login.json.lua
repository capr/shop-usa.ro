
check(POST)
local auth = json(POST.data)
local uid = login(auth)

out_json({success: uid ~= nil})
