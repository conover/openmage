require 'em-websocket'
require 'socket'
require 'redis'
OPTIONS = {:host => '127.0.0.1', :port => 6379, :thread_safe => true}

@redis = Redis.new(OPTIONS)

@client_games  = {  '10.171.155.144' => 1,
                    '10.171.155.111' => 1}
                    #10.171.155.73
                    #10.171.155.111
@game_worlds   = Hash.new

EventMachine.run {
    EventMachine::WebSocket.start(:host => '0.0.0.0', :port => 8080) { |ws|
        ws.onclose {
           puts 'Close' 
        }
        ws.onmessage { |msg|
            port, ip_address = Socket.unpack_sockaddr_in(ws.get_peername)
            game_id = @client_games[ip_address]
            if game_id.nil?
                puts 'Client does not belong to a game'
            else
                game_world = @game_worlds[game_id]
                if game_world.nil?
                    puts 'Game world does not exist'
                else
                    puts 'Publish msg to redis'
                    puts 'Incoming %s to game %s' % [msg, game_id.to_s()]
                    puts @redis.publish(game_id.to_s(), msg)
                end
            end
        }
        ws.onopen {
            port, ip_address = Socket.unpack_sockaddr_in(ws.get_peername)
            # Does this client belong in a game?
            game_id = @client_games[ip_address]
            if game_id.nil?
                puts 'Client %s does not belong to a game.' % ip_address
            else
                puts 'User belongs to a game'
                # Does this game have a world?
                if @game_worlds[game_id].nil?
                    puts 'Game world does not exist'
                    @game_worlds[game_id] = []
                    @game_worlds[game_id] << ws
                    puts 'Create game world'
                    # Start the game world
                    Thread.new do
                        puts 'Game world created'
                        Redis.new(OPTIONS).subscribe(game_id) do |on|
                            on.message do |chan, msg|
                                puts 'Sending %s' % msg
                                @game_worlds[game_id].each do |s|
                                    p, i = Socket.unpack_sockaddr_in(s.get_peername)
                                    puts 'Sending %s to %s ' % [msg, i]
                                    s.send msg
                                end
                            end
                        end
                    end
                else
                    puts 'Game world exists, add client to sub list'
                    @game_worlds[game_id] << ws
                end
            end
        }
    }
}