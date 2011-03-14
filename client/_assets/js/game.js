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
        ELEMENTS        = null,
        ELEMENT_KEYDOWN_KEYS    = [],//[81, 87, 69, 82, 65, 83, 68, 70],
        ELEMENT_KEYPRESS_KEYS   = [],//[113, 119, 101, 114, 97, 115, 100, 102],
        ELEMENT_LETTERS         = [],//['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'],
        ELEMENT_WATER       =  new function() {
                                        this.id = 0
                                        this.color  = 'rgba(0,0,255,.5)';
                                        this.letter = 'Q'
                                        this.keydown_key = 81;
                                        this.keypress_key = 113;
                                        this.level = 'top';
                                        return this.id;
                                    },
        ELEMENT_LIFE        = new function() {
                                        this.id = 1
                                        this.color  = 'rgba(0,255,0,.5)';
                                        this.letter = 'W'
                                        this.keydown_key = 87;
                                        this.keypress_key = 119;
                                        this.level = 'top';
                                        return this.id;
                                    },
        ELEMENT_SHIELD      = new function() {
                                        this.id = 2
                                        this.color  = 'rgba(255,255,0,.5)';
                                        this.letter = 'E'
                                        this.keydown_key = 69;
                                        this.keypress_key = 101;
                                        this.level = 'top';
                                        return this.id;
                                    },
        ELEMENT_COLD        = new function() {
                                        this.id = 3
                                        this.color  = 'rgba(100,175,255,.5)';
                                        this.letter = 'R'
                                        this.keydown_key = 82;
                                        this.keypress_key = 114;
                                        this.level = 'top';
                                        return this.id;
                                    },
        ELEMENT_LIGHTNING   = new function() {
                                        this.id = 4
                                        this.color  = 'rgba(150,0,255,.5)';
                                        this.letter = 'A'
                                        this.keydown_key = 65;
                                        this.keypress_key = 97;
                                        this.level = 'bottom';
                                        return this.id;
                                    },
        ELEMENT_ARCANE      = new function() {
                                        this.id = 5
                                        this.color  = 'rgba(255,0,0,.5)';
                                        this.letter = 'S'
                                        this.keydown_key = 83;
                                        this.keypress_key = 115;
                                        this.level = 'bottom';
                                        return this.id;
                                     },
        ELEMENT_EARTH       = new function() {
                                        this.id = 6
                                        this.color  = 'rgba(80,80,60,.5)';
                                        this.letter = 'D'
                                        this.keydown_key = 68;
                                        this.keypress_key = 100;
                                        this.level = 'bottom';
                                        return this.id;
                                    },
        ELEMENT_FIRE        = new function() {
                                        this.id = 7
                                        this.color  = 'rgba(255,175,0,.5)';
                                        this.letter = 'F'
                                        this.keydown_key = 70;
                                        this.keypress_key = 102;
                                        this.level = 'bottom';
                                        return this.id;
                                    },
        ELEMENT_STEAM        = new function() {
                                        this.id = 8
                                        this.color  = 'rgba(250,250,250,.5)';
                                        this.letter = null
                                        this.keydown_key = null;
                                        this.keypress_key = null;
                                        return this.id;
                                     },
        ELEMENT_ICE         = new function() {
                                        this.id = 9
                                        this.color  = 'rgba(135,195,222,.5)';
                                        this.letter = null
                                        this.keydown_key = null;
                                        this.keypress_key = null;
                                        return this.id;
                                    };
        ELEMENTS = [ELEMENT_WATER,ELEMENT_LIFE,ELEMENT_SHIELD,ELEMENT_COLD,
                        ELEMENT_LIGHTNING, ELEMENT_ARCANE, ELEMENT_EARTH, ELEMENT_FIRE,
                            ELEMENT_STEAM, ELEMENT_ICE]
        ELEMENTS.forEach(function(element) {
                if(element.keydown_key != null) {
                    ELEMENT_KEYDOWN_KEYS.push(element.keydown_key);
                }
                if(element.keypress_key != null) {
                    ELEMENT_KEYPRESS_KEYS.push(element.keypress_key);
                }
                if(element.letter != null) {
                    ELEMENT_LETTERS.push(element.letter);
                }
        });
        /*
        ELEMENT_KEYDOWN_KEYS    = [81, 87, 69, 82, 65, 83, 68, 70],
        ELEMENT_KEYPRESS_KEYS   = [113, 119, 101, 114, 97, 115, 100, 102],
        ELEMENT_LETTERS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'],
        var top_elements    =   [{  letter:'Q',   color: 'rgba(0,0,255,.5)'},
                                {   letter:'W',   color: 'rgba(0,255,0,.5)'},
                                {   letter:'E',   color: 'rgba(255,255,0,.5)'},
                                {   letter:'R',   color: 'rgba(100,175,255,.5)'},],
            bottom_elements =   [{  letter:'A',   color: 'rgba(150,0,255,.5)'},
                                {   letter:'S',   color: 'rgba(255,0,0,.5)'},
                                {   letter:'D',   color: 'rgba(80,80,60,.5)'},
                                {   letter:'F',   color: 'rgba(255,175,0,.5)'},],
        */
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
        if(ELEMENT_KEYDOWN_KEYS.indexOf(event.which) > -1) {
            element_pressed = ELEMENT_LETTERS[ELEMENT_KEYDOWN_KEYS.indexOf(event.which)];
        }
    });
    $('body').keyup(function(event) {
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
        
        var element = null;
        switch(event.which) {
            case 113:
                element = ELEMENT_WATER;
                break;
            case 119:
                element = ELEMENT_LIFE;
                break;
            case 101:
                element = ELEMENT_SHIELD;
                break;
            case 114:
                element = ELEMENT_COLD;
                break
            case 97:
                element = ELEMENT_LIGHTNING;
                break;
            case 115:
                element = ELEMENT_ARCANE;
                break;
            case 100:
                element = ELEMENT_EARTH;
                break;
            case 102:
                element = ELEMENT_FIRE;
                break;
        }
        
        if(local_mage.element_stack.length < 5) { // Max allowed elements
            var last_element = null;
            if(local_mage.element_stack.length > 0) {
                last_element = local_mage.element_stack[local_mage.element_stack.length - 1];
                
                if( (element == ELEMENT_WATER && last_element == ELEMENT_COLD) ||
                        (element == ELEMENT_COLD && last_element == ELEMENT_WATER)){
                    local_mage.element_stack.pop()
                    local_mage.element_stack.push(ELEMENT_ICE);
                } else if( (element == ELEMENT_WATER && last_element == ELEMENT_FIRE) ||
                            (element == ELEMENT_FIRE && last_element == ELEMENT_WATER)) {
                    local_mage.element_stack.pop()
                    local_mage.element_stack.push(ELEMENT_STEAM);
                } else if( (element == ELEMENT_WATER && last_element == ELEMENT_LIGHTNING) ||
                                (element == ELEMENT_LIGHTNING && last_element == ELEMENT_WATER)) {
                    local_mage.element_stack.pop()
                } else if( (element == ELEMENT_LIFE && last_element == ELEMENT_ARCANE) ||
                                (element == ELEMENT_ARCANE && last_element == ELEMENT_LIFE)) {
                    local_mage.element_stack.pop()
                } else if( (element == ELEMENT_COLD && last_element == ELEMENT_FIRE) ||
                                (element == ELEMENT_FIRE && last_element == ELEMENT_COLD)) {
                    local_mage.element_stack.pop()
                } else if( (element == ELEMENT_LIGHTNING && last_element == ELEMENT_EARTH) ||
                                (element == ELEMENT_EARTH && last_element == ELEMENT_LIGHTNING) ||
                                    (element == ELEMENT_LIGHTNING && last_element == ELEMENT_WATER) ||
                                        (element == ELEMENT_WATER && last_element == ELEMENT_LIGHTNING)) {
                    local_mage.element_stack.pop()
                } else {
                    local_mage.element_stack.push(element);                           
                }                            
            } else {
                local_mage.element_stack.push(element);   
            }
        }
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
        var bottom_left     =   new Point(-400, 300);
        
        for(var i = 0; i < 4; i++ ) {
            
            var vert_location   = new Point(bottom_left.x + 30, bottom_left.y - 20),
                top_element     = ELEMENTS[i],
                bottom_element  = ELEMENTS[i+4];
                
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