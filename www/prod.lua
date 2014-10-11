img_path = '/root/webb/webb/files/img'
img_webpath = '/files/img/p'

local function img_url(sid, size)
	local img_id = tostring(sid)
	return img_webpath ..
		img_id:gsub('(.)', '/%1') .. '/' ..
		img_id .. '-' .. size .. '_default.jpg'
end

local sizes = {
	thickbox = 'gallery',
	large = 'prod',
	home = 'browse',
	cart = 'thumb',
}

local pid = ...

local prod = query1([[
	select * from ps_product where id_product = ?
]], pid)

if not prod then not_found'product' end

prod.imgs = {}

for img in query([[
	select * from ps_image where id_product = ?
]], pid) do
	local i = img.position
	local t = {}
	prod.imgs[i] = t
	for k1, k2 in pairs(sizes) do
		t[k2] = img_url(img.id_image, k1)
	end
end

pp(prod)

out_json(prod)

