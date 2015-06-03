local from = config'sales_email' or home_email(S('sales', 'sales'))
local rcpt = 'cosmin.apreutesei@gmail.com'
print(config'smtp_host', config'smtp_port', from, rcpt)
print(sendmail(from, rcpt, 'test subj', 'test msg', 'html'))
