<div pid={{{pid}}} class=drop style="margin: 5px">
	<div style="min-width: 170px; min-height: 210px">
		<a href="/p/{{{slug}}}"><img src="/img/p/{{{imgid}}}-home.jpg"></a>
	</div>
	<a href="/p/{{{slug}}}"><b>{{{bname}}}</b> {{{name}}}</a>
	<br>
	<span class=price>
		{{{price}}} Lei
	</span>
	{{#discount}}
		<br>
		<span class=discount>
			({{{discount}}}%{{#msrp}} <s>{{{msrp}}} Lei</s>{{/msrp}})
		</span>
	{{/discount}}
	<br>
	<br>
</div>
