
pp(query[[

create table if not exists usr (
	uid         int primary key auto_increment,
	firstname   varchar(32) not null,
	lastname    varchar(32) not null,
	email       varchar(128) not null,
	passwd      varchar(32) not null,
	active      tinyint not null default 0,
	birthday    date,
	newsletter  tinyint not null default 0,
	isadmin     tinyint not null default 0,
	note        text,
	atime       timestamp default current_timestamp,
	mtime       timestamp on update current_timestamp
);

drop table session;
drop table cart;

create table if not exists session (
	sessid      int primary key auto_increment,
	token       varchar(64) not null unique key,
   uid         int references users (uid) on delete cascade,
	clientip    varchar(32),
	cartid      int,
	atime       timestamp default current_timestamp,
	mtime       timestamp on update current_timestamp
);

create table if not exists cart (
	cartid      int primary key auto_increment,
	uid         int references usr (uid) on delete cascade,
	sessid      int references session (sessid) on delete cascade
);

alter table session add foreign key (cartid) references cart (cartid);

create table if not exists cartitem (
	iid         int primary key auto_increment,
	cartid      int not null references cart (cartid) on delete cascade,
	pid         int not null references ps_product (id_product) on delete cascade,
	pos         int not null default 0,
	buylater    tinyint not null default 0
);

create table cartitemval (
	iid         int not null references cartitem (iid) on delete cascade,
   vid         int not null references ps_product_attribute (id_product) on delete cascade
);

]])

