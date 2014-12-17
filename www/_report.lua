--[[

client-server reporting protocol:

dataset = {
	type = 'grid,tree',
	idfield = fieldname,
	detail = dataset,
},

field = {
	name = S,
	type = 'string,text,number,date,time,datetime,lookup',
	decimals = N,
	maxsize = N,
	lookup = {dataset = dataset, idfield = fieldname, displayfield = fieldname},
}

grid = {
	type = 'grid',
	fields = [field1,...],
	idfield = fieldname,
	rows = [row1,...]; row=[v1,...],
	rowindex = N,
	rowcount = N,
	detail = dataset,
	api =
		fetch(rowindex,rowcount,orderby)
		add(values)
		delete(id)
		update(id, values)
		save_state({columns=[{name,width,visible},...],orderby=})
}

tree = {
	type = 'tree',
	fields = [field1,...],
	idfield = fieldname,
	root = node; node = {row = row, children = [node1,...]}
	detail = dataset,
	api =
		fetch_children(parent_id, depth)
		add_node(parent_id, values)

}

]]

