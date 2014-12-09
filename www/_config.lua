setfenv(1, require'g')

config('basepath', '../www')

if config('lang', 'en') == 'ro' then

S('reset_pass_subject', 'Linkul pentru schimbarea parolei')

S('order_placed_subject', 'Comanda nr. %s la %s')
S('shiptype_home', 'Prin curier')
S('shiptype_store', 'La magazin')
S('sales', 'comenzi')

end
