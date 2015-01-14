## Dataset

### Nomenclature

	s:        string
	n:        count of some kind
	i:        index of some kind
	v:        value of some kind
	k:        key in a hash
	[v1,...]  array
	[i: v]    array
	{k: v}    hash

	vfi:      visible field index
	vri:      visible row index
	fi:       field index
	ri:       row index
	field:    field definition object
	row:      row object
	val:      cell value (typed)

### Constructor

#### config

	d.init()

(Re-)initialize the dataset. Required after any config values are changed.

#### runtime

	var d = dataset(options)

Create a dataset. The options arg can contain any fields and methods,
and will override the default fields. This can be used for extending,
overriding, configuration, whatever (i.e. prototype-based inheritance).

### Events

#### runtime

	d.on(e, function(e, args...))  see [jQuery.on()](http://api.jquery.com/on/)
	d.trigger(e, args...)          see [jQuery.trigger()](http://api.jquery.com/trigger/)

The event system is based on the jQuery events API.
Refer to that for more details.

### Fields

#### config

	d.fields <- [fi: field_def]

	field_def: {
		name:,
		client_default: v,        default value as if the user typed it in
		server_default: v,        default value that the server would set
	}

Field definitions are required for all the fields.

The difference between client and server default value is that the
server default value is not recorded in the changeset and thus is not sent
to the server, because it's what the server would set for a new record anyway.

	d.fieldmap <- [vfi: fi]

Set a mapping between visual field indices and real field indices.
This allows fields to be reordered and/or hidden without touching the
values arrays. The default mapping is: `[fi1, ...]`, i.e. all fields are
visibile, and in original order.

#### runtime

	d.fieldcount() -> n          count visual fields
	d.field(vfi) -> field        access a field definition
	d.move_field(svfi, dvfi)     move a field to a different visual field index

### Rows

#### config

	d.rows <- [ri: row]; row = {values: [fi: val], attr: val, ...}
	d.filter <- function(values, ri) -> true|false
	d.new_row <- function() -> row

#### runtime

	d.rowcount() -> n
	d.row(vri) -> row
	d.insert(vri) -> added_row
	d.remove(vri) -> removed_row

### Row IDs

#### config

	d.id_field_name <- name
	d.id_field_index <- index      (default 0)

#### runtime

	d.row_id(vri) -> id

### Values

#### config

	d.converters <- {<type>: function(val, field) -> val}
	d.validators <- {<type>: function(val, field) -> throw ValidationError(message)}
	d.ValidationError <- Error subclass

#### runtime

	d.val(vri, vfi) -> val
	d.setval(vri, vfi, val) -> converted_val

	d.validate(val, field) -> throw ValidationError
	d.convert(val, field) -> val

### Tree

#### config

	d.parent_field <- name | index         parent field name or index

#### runtime

	d.parent_id(vri) -> id                 parent id of a row
	d.expanded(vri) -> true|false          is the node at vri expanded?
	d.setexpanded(vri, expanded)           set a node as expanded or collapsed
	d.collapse_all()                       collapse all nodes
	d.expand_all()                         expand all nodes

### Changeset

#### runtime

	d.row_is_new(vri) -> true|false        is the row a new row not yet uploaded?
	d.row_changed(vri) -> true|false       does the row have changed values?
	d.val_changed(vri, vfi) -> true|false  was the cell changed?
	d.oldval(vri, vfi) -> val              value before changing
	d.changes() -> changeset               changeset object
	d.reconcile(results)                   merge changeset with server results
	d.apply_changes()                      merge changeset into the dataset
	d.cancel_changes()                     reverting to original rows and values

### Remote

To enable remote saving and loading, you need to set `d.url_path`
at the minimum, which will enable JSON-based loading/saving via GET/POST.

#### config

	d.url_path <- s                     base url for saving and loading
	d.url_args <- [arg1,...]            path components after url_path
	d.url_params <- {k1=v1,...}         url query params
	d.page <- n                         current page to load (default 1)
	d.page_size <- n                    number of rows per page (default 100)
	d.sort_expr() -> 'fieldname:asc|desc,...'  make the sort expression
	d.url() -> url                      make the load/save url
	d.ajax([data], [success], [error])  make the load/save request

#### runtime

	d.load([success], [error])          (re)load the dataset at current page.
	d.save([success], [error])          save the current changeset to the remote.

