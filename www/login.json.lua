
check(POST)
local auth = json(POST.data)
local uid = login(auth)
pp(query1('select * from usr where uid = ?', uid))
