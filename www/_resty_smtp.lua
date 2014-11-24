
    local socket = ngx.socket

    socket._VERSION = "ngx_lua cosocket"

    socket.protect = function (f)
        local rm = table.remove
        return function (...)
            local rets = {pcall(f, ...)}
            if rets[1] then
                rm(rets, 1);
                return unpack(rets)
            else
                local err = rets[2]
                if type(err) == "table" then
                    return nil, err[1]
                else
                    return error(err)
                end
            end
        end
    end

    socket.sink = function (name, sock)
        if name ~= 'keep-open' then
            return error(name .. " not supported")
        end
        return setmetatable({}, {
            __call = function (self, chunk, err)
                if chunk then return sock:send(chunk)
                else return 1 end
            end
        })
    end

    socket.newtry = function (f)
        return function (...)
            local args = {...}
            if not args[1] then
                if f then
                    pcall(f)
                end
                return error({args[2]})
            end
            return ...
        end
    end

    socket.try = socket.newtry()

    socket.skip = function (d, ...)
        local args = {...}
        local rm = table.remove
        for i = 1, d do
            rm(args, 1)
        end
        return unpack(args)
    end

And then we make Lua believe that the "socket" module is already
loaded (and it is actually our ngx.socket instead of LuaSocket's):

    package.loaded.socket = ngx.socket

Then we load LuaSocket's socket.smtp module and use it as usual:

    local smtp = require("socket.smtp")
    local mime = require("mime")
    local ltn12 = require("ltn12")

    source = smtp.message{
      headers = {
         from = "agentzh <age...@gmail.com>",
         to = "foo <f...@bar.com>",
         subject = "Hello, guy!"
      },
      body = {
        preamble = "preamble",
        [1] = { body = mime.eol(0, "Hello, how is going?") },
      }
    }

    r, e = smtp.send{
        from = "<sic...@example.com>",
        rcpt = "<ful...@example.com>",
        source = source,
        server = "127.0.0.1",
        port = 25,
    }

    if not r then
        ngx.say("failed to send: ", e)
    end

    ngx.say("done!")
