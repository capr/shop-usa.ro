
t = {1, 2, 3, 4, [5] = 'a', [6] = 'b'}
table.insert(t, 5, 'x')
require'pp'(t)
