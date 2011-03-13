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
        
        mouse_loc       = new Point(0,0), // Current mouse location
        
        element_pressed = null,
        ELEMENT_KEYDOWN_KEYS    = [81, 87, 69, 82, 65, 83, 68, 70];
        ELEMENT_KEYPRESS_KEYS   = [113, 119, 101, 114, 97, 115, 100, 102],
        ELEMENT_LETTERS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'];
        // Q 113
        // W 119
        // E 101
        // R 114
        // - 
        // A 97
        // S 115
        // D 100
        // F 102
        
    
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
    play_area.mousedown(function(event) {
        mouse_dragging = true;
        if(event.shiftKey) {
            local_mage.target_loc = null;
            local_mage.fire_beam(mouse_loc);
            beam_firing = true;
        } else {
            local_mage.move(mouse_loc);
        }
    })
    play_area.mouseup(function() {
        mouse_dragging = false;
        local_mage.target_loc = null;
        if(beam_firing) {
            local_mage.stop_beam();
            beam_firing = false;
        }
    })
    play_area.mousemove(function(event) {
        var x = Math.floor((event.pageX-play_area.offset().left-400)),
            y = Math.floor((event.pageY-play_area.offset().top -300));
        
        mouse_loc = new Point(x, y);
        if(mouse_dragging && !beam_firing) {
            local_mage.move(mouse_loc);
        } else if(beam_firing) {
            local_mage.fire_beam(mouse_loc);   
        }
    });
    $('body').keydown(function(event) {
        //console.log(event.which);
        //if(event.which == 49) { // `1` Key
        //    local_mage.target_loc = null;
        //    local_mage.fire_beam(mouse_loc);
        //    beam_firing = true;
        //} else 
        if(ELEMENT_KEYDOWN_KEYS.indexOf(event.which) > -1) {
            element_pressed = ELEMENT_LETTERS[ELEMENT_KEYDOWN_KEYS.indexOf(event.which)];
        }
    });
    $('body').keyup(function(event) {
        //console.log(event.which);
        //if(event.which == 49) {
        //    local_mage.stop_beam();
        //    beam_firing = false;
        //}
        element_pressed = null;
    });
    $('body').keypress(function(event) {
        //console.log(event.which);
        // Q 113
        // W 119
        // E 101
        // R 114
        // - 
        // A 97
        // S 115
        // D 100
        // F 102
            
    });
    
    
    var frame_count = 0
    function game_loop() {
        context.clearRect(-400,-300, 800,600);
        draw_global_elements();
        entity_manager.maintain(context, ws_queue);
        if(ws_queue.length > WS_QUEUE_FLUSH_LEN || frame_count > WS_FRAME_TIMEOUT) {
            flush_ws_queue();
            frame_count = 0
        }
        frame_count += 1
        game_timer = setTimeout(game_loop, tick_duration);
    }
    game_loop()
    
    function draw_global_elements() {
        // Elements drawn in the bottom left to incidate pressing
        // QWER
        // ASDF
        var top_elements    =   [{  letter:'Q',   color: 'rgba(0,0,255,.5)'},
                                {   letter:'W',   color: 'rgba(0,255,0,.5)'},
                                {   letter:'E',   color: 'rgba(255,255,0,.5)'},
                                {   letter:'R',   color: 'rgba(100,175,255,.5)'},],
            bottom_elements =   [{  letter:'A',   color: 'rgba(150,0,255,.5)'},
                                {   letter:'S',   color: 'rgba(255,0,0,.5)'},
                                {   letter:'D',   color: 'rgba(80,80,60,.5)'},
                                {   letter:'F',   color: 'rgba(255,175,0,.5)'},],
            bottom_left     =   new Point(-400, 300);
        
        
        for(var i = 0; i < 4; i++ ) {
            
            var vert_location   = new Point(bottom_left.x + 30, bottom_left.y - 20),
                bottom_element  = bottom_elements[i],
                top_element     = top_elements[i];
            [bottom_element,top_element].forEach(function(element) {
                
                // Draw the element letter
                if(element_pressed == element.letter) {
                    context.font = 'bold 15px "Courier New"';   
                } else {
                    context.font = 'normal 15px "Courier New"';
                }
                context.fillStyle = 'black';
                context.fillText(element.letter, vert_location.x + (i * 32), vert_location.y);
                
                // Draw the element circle                
                if(element_pressed == element.letter) {
                    context.fillStyle = element.color.slice(0, element.color.length - 3) + '1)';
                    context.strokeStyle = 'rgba(100,100,100,1)';
                } else {
                    context.strokeStyle = 'rgba(100,100,100,.5)';
                    context.fillStyle = element.color
                }
                context.beginPath();
                if(i == 0) {
                    context.arc(vert_location.x + 21, vert_location.y + 5 , 10, 0, Math.PI * 2, true);
                } else {
                    context.arc(vert_location.x + (i * 32) + 19, vert_location.y + 5 , 10, 0, Math.PI * 2, true);
                }
                context.closePath();
                context.fill();
                context.stroke();
                vert_location.y = vert_location.y - 26;
                vert_location.x = vert_location.x - 19;
            })
        }
    }
}