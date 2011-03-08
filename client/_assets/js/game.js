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
        context         = null;
        
    
    
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
    local_mage.set_color('rgb(0,200,100)')
    entity_manager.add_entity(local_mage);
    
    // Event Handlers for moving the local mage
    var mouse_dragging
    play_area.mousedown(function() {mouse_dragging = true;})
    play_area.mouseup(function() {mouse_dragging = false;})
    play_area.mousemove(function(e) {
        if(mouse_dragging) {
            var x = Math.floor((e.pageX-play_area.offset().left-400)),
                y = Math.floor((e.pageY-play_area.offset().top -300));
            local_mage.move(x, y)
        }
    })
    play_area.click(function(e) {
        var x = Math.floor((e.pageX-play_area.offset().left-400)),
            y = Math.floor((e.pageY-play_area.offset().top -300));
        local_mage.move(x, y);
    })
    
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