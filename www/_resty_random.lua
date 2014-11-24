local ffi = require'ffi'

ffi.cdef[[
int RAND_pseudo_bytes(unsigned char *buf, int num);
]]

local t = ffi.typeof('uint8_t[?]')

local function random(len)
    local s = ffi.new(t, len)
    ffi.C.RAND_pseudo_bytes(s, len)
    return ffi.string(s, len)
end

return random

