--persistent global namespace
local G = {}
setmetatable(G, G)
G.__index = _G
return G
