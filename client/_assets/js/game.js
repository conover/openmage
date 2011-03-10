var GameManager = function(play_area_id) {
    var that            = this,
        
        tick_duration   = 35, // in milliseconds
        game_timer      = null,
        
        WEBSOCKET_HOST  = '10.171.155.144',
        WEBSOCKET_PORT  = '8080',
        socket          = null,
        connected       = false,
        
        ws_queue        = [],
        WS_QUEUE_FLUSH_LEN = 10,
        WS_FRAME_TIMEOUT = 10,
        
        entity_manager  = null,
        
        play_area       = null,
        context         = null,
        
        mouse_loc       = null; // Current mouse location
        
    
    
    // Connect to the WebSocket server
    if ("WebSocket" in window) {
        
        socket = new WebSocket('ws://' + WEBSOCKET_HOST + ((WEBSOCKET_PORT != '') ? ':' + WEBSOCKET_PORT : ''))
        socket.onopen = function() {
            connected = true;
        }
        socket.onclose = function() {
            connected = false;
        }
        socket.onmessage = function(e) {
            var split = e.data.split('|', 3)
            var id      = split[0], 
                type    = split[1],
                json    = split[2],
                found   = false;
            console.log(split)
            entity_manager.entities.forEach(function(entity) {
                console.log(entity.id + ' ' + id)
                if(entity.id == id) {
                    entity.from_json(json);
                    found = true;
                }
            });
            if(!found) {
                if(type == 'mage') {
                    console.log('create')
                    var new_entity = new Mage()
                    new_entity.from_json(json)
                    entity_manager.add_entity(new_entity)
                    new_entity.id = id
                }
            }
        }
    } else {
        console.log('Browser does not support WebSockets')
    }
    
    function flush_ws_queue() {
        if(connected) {
            var l = ws_queue.length;
            for(var i = 0; i < l;i++) {
                var msg = ws_queue.shift();
                //console.log('test ' + msg);
                socket.send(msg);
            }
        }
    }
    
    // Initialize the play area
    play_area   = document.getElementById(play_area_id);
    context     = play_area.getContext('2d');
    play_area   = $('#play_area');
    context.translate(400, 300)
    
    
    // Initialize the entity manager
    entity_manager = new EntityManager();
    
    // Create the local player
    var local_mage = new Mage();
    local_mage.local = true
    local_mage.set_loc(new Point(0,0));
    
    red_color   = Math.floor(Math.random() * 255)
    green_color = Math.floor(Math.random() * 255)
    blue_color  = Math.floor(Math.random() * 255)
    
    local_mage.set_color('rgb(' + red_color + ',' + green_color + ',' + blue_color + ')')
    entity_manager.add_entity(local_mage);
    
    // Event Handlers for moving the local mage
    var mouse_dragging = false,
        beam_firing = false;
    play_area.mousedown(function() {
        mouse_dragging = true;
        if(!beam_firing) {
            local_mage.move(mouse_loc);
        }
    })
    play_area.mouseup(function() {
        console.log('mouse up')
        mouse_dragging = false;
        local_mage.target_loc = null;
    })
    play_area.mousemove(function(e) {
        var x = Math.floor((e.pageX-play_area.offset().left-400)),
            y = Math.floor((e.pageY-play_area.offset().top -300));
        
        mouse_loc = new Point(x, y);
        if(mouse_dragging && !beam_firing) {
            local_mage.move(mouse_loc);
        }
    });
    $('body').keydown(function(event) {
        //console.log(event.which);
        if(event.which == 49) {
            local_mage.target_loc = null;
            local_mage.fire_beam(mouse_loc);
            beam_firing = true;
        }
    });
    $('body').keyup(function(event) {
        //console.log(event.which);
        if(event.which == 49) {
            local_mage.stop_beam();
            beam_firing = false;
        }
    });
    
    
    
    var frame_count = 0
    function game_loop() {
        context.clearRect(-400,-300, 800,600);
        entity_manager.maintain(context, ws_queue);
        if(ws_queue.length > WS_QUEUE_FLUSH_LEN || frame_count > WS_FRAME_TIMEOUT) {
            flush_ws_queue();
            frame_count = 0
        }
        frame_count += 1
        game_timer = setTimeout(game_loop, tick_duration);
    }
    game_loop()
}