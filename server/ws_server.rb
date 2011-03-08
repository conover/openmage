require 'em-websocket'
require 'socket'
require 'redis'
OPTIONS = {:host => '127.0.0.1', :port => 6379, :thread_safe => true}

@redis = Redis.new(OPTIONS)

@world = nil
@clients = []

EventMachine.run {
    EventMachine::WebSocket.start(:host => '0.0.0.0', :port => 8080) { |ws|
        ws.onclose {
           puts 'Close' 
        }
        ws.onmessage { |msg|
            puts @redis.publish('world', msg)
        }
        ws.onopen {
            
            if @world.nil?
                @world = false
                Thread.new do
                    puts 'Game world created'
                    Redis.new(OPTIONS).subscribe('world') do |on|
                        on.message do |chan, msg|
                            puts 'Sending %s' % msg
                            @clients.each do |s|
                                p, i = Socket.unpack_sockaddr_in(s.get_peername)
                                puts 'Sending %s to %s ' % [msg, i]
                                s.send msg
                            end
                        end
                    end
                end
                @clients << ws
            else
                puts 'Game world exists, add client to sub list'
                @clients << ws
            end
        }
    }
}