
// global S() for internationalizing strings.
var S_ = {}
function S(name, val) {
	if (val && !S_[name])
		S_[name] = val
	return S_[name]
}

// global C() for general config values.
var C_ = {}
function C(name, val) {
	if (val && !C_[name])
		C_[name] = val
	return C_[name]
}

// usage:
//		'{1} of {0}'.format(total, current)
//		'{1} of {0}'.format([total, current])
//		'{current} of {total}'.format({'current': current, 'total': total})
String.prototype.format = function() {
	var s = this.toString()
	if (!arguments.length)
		return s
	var type1 = typeof arguments[0]
	var args = ((type1 == 'string' || type1 == 'number') ? arguments : arguments[0])
	for (arg in args)
		s = s.replace(RegExp('\\{' + arg + '\\}', 'gi'), args[arg])
	return s
}

