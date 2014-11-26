<?
local aname = ...
local a = {}
local template = {}

local hige = require'hige'

local function render(name, data)
	return hige.render(template[name], data)
end

template.p = [[
<p><a href="/browse/brand/{{{bid}}}"><img src="/img/m/{{{bid}}}.jpg"></a></p>

<p><a href="/browse/brand/{{{bid}}}"><b>{{{bname}}}</b></a> {{{name}}}</p>

<ul>
{{#dims}}
	<li> {{dname}}:
		<select did={{{did}}}>
			{{#dvals}}
				<option value="{{{dvid}}}" {{{selected}}}>{{dvname}}</option>
			{{/dvals}}
		</select>
	</li>
{{/dims}}
</ul>

<p>{{{descr}}}</p>
]]

function a.p(...)
	push_outbuf()
	action('prod.json', ...)
	out(render('p', json(pop_outbuf())))
end

local act = a[aname]
act(select(2, ...))
