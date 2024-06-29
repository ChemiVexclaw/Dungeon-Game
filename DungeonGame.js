// Debug settings
var seeAll = false;

// Game settings
var inputCooldown = 200;
var renderDistance = 15;
var minimapEnabled = true;
var seePlayerOnMap = true;

// Represents a vector with two values
class Vector2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

// Generate random whole number between
function rnd(in1, in2){
    if(in1 < in2){
        return Math.round(in1 + (in2 - in1) * Math.random()); // in2 and in1 value
    } else if(in1 != undefined){
        return Math.round(in1 * Math.random()); // 0 and in1
    } else{
        return undefined;
    }
}

// Class representing player character
class Player{
    constructor(rotation, sprite){
        this.position;
        this.rotation = rotation;
        this.sprite = sprite;
    }
}

// Class representing game tiles
class tile{
    constructor(walkable, seen, type){
        this.walkable = walkable;
        this.seen = seen;
        this.type = type;
    } 
}

// Track all tiles on map
let tiles = new class tiles{};

// Map Generation Settings
var roomMaxSize = new Vector2(10, 10);
var roomMinSize = new Vector2(6, 6);
var roomMargin = 2;
var layout = new Vector2(5, 5);
var startingRoom;

// size of tile and offset on x-axis
var tileSize;
var xOffset;
function calculatePixelSize(){
    tileSize = Math.round(canvas.height / (renderDistance * 2 + 1));
    xOffset = (canvas.width - canvas.height) / 2;
}

// Startup function
function startUp(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.style.background = "#777";
    calculatePixelSize();
    generateMap();
    inputTime = Date.now();
    walkTime = inputTime;
    render();
    gameTick();
}

// Gets and stores player input
var input = {};
document.addEventListener('keydown', function(event){
    input[event.key.toLowerCase()] = true;  
})
document.addEventListener('keyup', function(event) {
    input[event.key.toLowerCase()] = false;
})
var inputTime;
let player = new Player("up", undefined);

// Canvas
let canvas = document.getElementById("canvas");
/** 
 * @type {CanvasRenderingContext2D}
 */
let context = canvas.getContext("2d");

// Resize canvas size when resizing window
window.onresize = function(ev) { 
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    calculatePixelSize();
    render();
}

// Calls all rendering functions
function render(){
    clearCanvas();
    renderTiles();
    renderPlayer();
    renderUI();
    renderMinimap();
}

// Room generation
class Room{
    constructor(position, size){
        this.size = size;
        this.position = position;
        this.neighbours = [];
    }
}

function generateMap(){
    tiles = new class tiles{};
    // Select starting room
    startingRoom = new Vector2(rnd(layout.x - 1), rnd(layout.y - 1));

    // Rooms
    var rooms = [];
    for(var x = 0; x < layout.x; x++){
        rooms.push(new Array);
        for(var y = 0; y < layout.y; y++){
            rooms[x].push(new Room(new Vector2(( x * (2 * roomMargin + roomMaxSize.x) + roomMargin), ( y * (2 * roomMargin + roomMaxSize.y) + roomMargin)), new Vector2(rnd(roomMinSize.x, roomMaxSize.x), rnd(roomMinSize.y, roomMaxSize.y))));
        }
    }
    rooms.forEach(row =>{
        row.forEach(room =>{
            for(var x2 = room.position.x; x2 < room.position.x + room.size.x; x2++){
                for(var y2 = room.position.y; y2 < room.position.y + room.size.y; y2++){
                    if(room == rooms[startingRoom.x][startingRoom.y]){
                        tiles[x2 + ":" + y2] = new tile(true, true, "floor")
                    }else{
                        tiles[x2 + ":" + y2] = new tile(true, false, "floor")
                    }
                }
            }
        })
    })

    // Sets player position in starting room
    player.position = new Vector2(rooms[startingRoom.x][startingRoom.y].position.x, rooms[startingRoom.x][startingRoom.y].position.y);

    // Walls
    rooms.forEach(row =>{
        row.forEach(room =>{
            for(var x = room.position.x - 1; x <= room.position.x + room.size.x; x++){
                wall(room, x, room.position.y - 1);
                wall(room, x, room.position.y + room.size.y);
            }
            for(var y = room.position.y; y <= room.position.y + room.size.y; y++){
                wall(room, room.position.x - 1, y);
                wall(room, room.position.x + room.size.x, y);
            }
        })
    })

    function wall(room, x, y){
        if(room == rooms[startingRoom.x][startingRoom.y]){
            tiles[x+":"+y] = new tile(false, true, "wall")
        }else{
            tiles[x+":"+y] = new tile(false, false, "wall")
        }
    }

    // Calculates neighbours for rooms
    for(var x = 0; x < layout.x; x++){
        for(var y = 0; y < layout.y; y++){
            for(var xComp = 0; xComp < layout.x; xComp++){
                for(var yComp = 0; yComp < layout.y; yComp++){
                    if((x == xComp && (y == yComp - 1 || y == yComp + 1)) || (y == yComp && (x == xComp - 1 || x == xComp + 1))){
                        rooms[x][y].neighbours.push(rooms[xComp][yComp]);
                    }
                }
            }
        }
    }

    // Generate Paths
    class path{
        constructor(start, end){
            this.start = start;
            this.end = end;
        }
    }
    var paths = [];
    var connected = [];
    connected.push(rooms[startingRoom.x][startingRoom.y]);
    while(true){
        if(paths.length >= layout.x * layout.y - 1){
            break;
        }
        for(var x = 0; x < rooms.length; x++){
            if(paths.length >= layout.x * layout.y - 1){
                break;
            }
            for(var y = 0; y < rooms[x].length; y++){
                var room = rooms[x][y];
                if(!connected.includes(room)){
                    var connectedNeighbours = [];
                    for(var i = 0; i < room.neighbours.length; i++){
                        if(connected.includes(room.neighbours[i])){
                            connectedNeighbours.push(room.neighbours[i]);
                        }
                    }
                    if(connectedNeighbours.length > 0){
                        var i = rnd(connectedNeighbours.length);
                        if(i != connectedNeighbours.length){
                            paths.push(new path(room, connectedNeighbours[i]));
                            connected.push(room);
                        }
                    }
                    if(paths.length >= layout.x * layout.y - 1){
                        break;
                    }
                }
            }
        } 
    }
    // Translate paths into tiles
    paths.forEach(i => {
        if(i.start.position.x < i.end.position.x){ // Going right
            var y = i.start.position.y + roomMinSize.y / 2;
            for(var x = i.start.position.x + i.start.size.x; x < i.end.position.x; x++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "wall"){
                        tiles[x+":"+y].type = "door";
                        tiles[x+":"+(y - 1)].type = "door";
                    }
                }else{
                    tiles[x+":"+y] = new tile(true, false, "floor");
                    tiles[x+":"+(y - 1)] = new tile(true, false, "floor");
                    tiles[x+":"+(y - 2)] = new tile(false, false, "wall");
                    tiles[x+":"+(y + 1)] = new tile(false, false, "wall");
                }
            }
        }else if(i.start.position.x > i.end.position.x){ // Going left
            var y = i.start.position.y + roomMinSize.y / 2;
            for(var x = i.start.position.x; x >= i.end.position.x + i.end.size.x; x--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "wall"){
                        tiles[x+":"+y].type = "door";
                        tiles[x+":"+(y - 1)].type = "door";
                    }
                }else{
                    tiles[x+":"+y] = new tile(true, false, "floor");
                    tiles[x+":"+(y - 1)] = new tile(true, false, "floor");
                    tiles[x+":"+(y - 2)] = new tile(false, false, "wall");
                    tiles[x+":"+(y + 1)] = new tile(false, false, "wall");
                }
            }
        }else if(i.start.position.y < i.end.position.y){ // Going down
            var x = i.start.position.x + roomMinSize.x / 2;
            for(var y = i.start.position.y + i.start.size.y; y < i.end.position.y; y++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "wall"){
                        tiles[x+":"+y].type = "door";
                        tiles[(x - 1)+":"+y].type = "door";
                    }
                }else{
                    tiles[x+":"+y] = new tile(true, false, "floor");
                    tiles[(x - 1)+":"+y] = new tile(true, false, "floor");
                    tiles[(x - 2)+":"+y] = new tile(false, false, "wall");
                    tiles[(x + 1)+":"+y] = new tile(false, false, "wall");
                }
            }
        }else{ // Going up
            var x = i.start.position.x + roomMinSize.x / 2;
            for(var y = i.start.position.y; y >= i.end.position.y + i.end.size.y; y--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "wall"){
                        tiles[x+":"+y].type = "door";
                        tiles[(x - 1)+":"+y].type = "door";
                    }
                }else{
                    tiles[x+":"+y] = new tile(true, false, "floor");
                    tiles[(x - 1)+":"+y] = new tile(true, false, "floor");
                    tiles[(x - 2)+":"+y] = new tile(false, false, "wall");
                    tiles[(x + 1)+":"+y] = new tile(false, false, "wall");
                }
            }
        }
    })
}

// Clears canvas
function clearCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
}

// Renders tiles
function renderTiles(){
    for(var x = 0; x <= renderDistance * 2; x++){
        for(var y = 0; y <= renderDistance * 2; y++){
            var i = tiles[(x + player.position.x - renderDistance)+":"+(y + player.position.y - renderDistance)];
            if(i == undefined){
            }else if(i.seen || seeAll){
                var sprite = new Image();
                sprite.src = "Textures/" + i.type + ".png";
                context.drawImage(sprite, x * tileSize + xOffset, y * tileSize, tileSize, tileSize);
            }
        }
    }
}

// Calls new game tick
function gameTick(){
    requestAnimationFrame(gameTick);
    playerInput();
    render();
}

// Renders player
function renderPlayer(){
    context.fillStyle = "#f00";
    context.fillRect(renderDistance * tileSize + xOffset, renderDistance * tileSize, tileSize, tileSize);
}

// Player actions
function playerInput(){
    if(Date.now() - walkTime > inputCooldown){
        if((input["w"] || input["arrowup"]) && (player.rotation != "up" || tiles[player.position.x+":"+(player.position.y - 1)].walkable || tiles[player.position.x+":"+(player.position.y - 1)].type == "door")){
            player.rotation = "up";
            if(tiles[player.position.x+":"+(player.position.y - 1)].type == "door"){
                openDoor();
            }
            if(tiles[player.position.x+":"+(player.position.y - 1)].walkable){
                player.position.y--;
            }
            walkTime = Date.now();
        }else if((input["s"] || input["arrowdown"]) && (player.rotation != "down" || tiles[player.position.x+":"+(player.position.y + 1)].walkable || tiles[player.position.x+":"+(player.position.y + 1)].type == "door")){
            player.rotation = "down";
            if(tiles[player.position.x+":"+(player.position.y + 1)].type == "door"){
                openDoor();
            }
            if(tiles[player.position.x+":"+(player.position.y + 1)].walkable){
                player.position.y++;
            }
            walkTime = Date.now();
        }else if((input["a"] || input["arrowleft"]) && (player.rotation != "left" || tiles[(player.position.x - 1)+":"+player.position.y].walkable || tiles[(player.position.x - 1)+":"+player.position.y].type == "door")){
            player.rotation = "left";
            if(tiles[(player.position.x - 1)+":"+player.position.y].type == "door"){
                openDoor();
            }
            if(tiles[(player.position.x - 1)+":"+player.position.y].walkable){
                player.position.x--;
            }
            walkTime = Date.now();
        }else if((input["d"] || input["arrowright"]) && (player.rotation != "right" || tiles[(player.position.x + 1)+":"+player.position.y].walkable || tiles[(player.position.x + 1)+":"+player.position.y].type == "door")){
            player.rotation = "right";
            if(tiles[(player.position.x + 1)+":"+player.position.y].type == "door"){
                openDoor();
            }
            if(tiles[(player.position.x + 1)+":"+player.position.y].walkable){
                player.position.x++;
            }
            walkTime = Date.now();
        }
    }
    if(Date.now() - inputTime > inputCooldown){
        if(input["e"] && tileInFront().type == "door"){
            openDoor();
            inputTime = Date.now();
        }
    }
}

// Finds tile in front of player
function tileInFront(){
    if(player.rotation == "up"){
        return tiles[player.position.x + ":" + (player.position.y - 1 )];
    }else if(player.rotation == "down"){
        return tiles[player.position.x + ":" + (player.position.y + 1 )];
    }else if(player.rotation == "left"){
        return tiles[(player.position.x - 1) + ":" + player.position.y];
    }else if(player.rotation == "right"){
        return tiles[(player.position.x + 1) + ":" + player.position.y];
    }
}

// See new room/path (open door)
function openDoor(){
    var start;
    var end;
    if(player.rotation == "up"){
        start = new Vector2(player.position.x, player.position.y - 1);
        end = new Vector2(player.position.x, player.position.y - 1);
        while(true){
            if(tiles[end.x+":"+end.y].seen && tiles[end.x+":"+end.y].type == "door"){
                tiles[end.x+":"+end.y] = new tile(true, true, "floor");
            }else if(tiles[end.x+":"+end.y].type == "door" || tiles[end.x+":"+end.y].type == "wall"){
                tiles[end.x+":"+end.y].seen = true;
                break;
            }else{
                tiles[end.x+":"+end.y].seen = true;
            }
            end.y--;
        }
        var i = false;
        for(var x = start.x - 1; true; x--){
            if(i){break}
            for(var y = start.y; y >= end.y; y--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
        i = false;
        for(var x = start.x + 1; true; x++){
            if(i){break}
            for(var y = start.y; y >= end.y; y--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
    }else if(player.rotation == "down"){
        start = new Vector2(player.position.x, player.position.y + 1);
        end = new Vector2(player.position.x, player.position.y + 1);
        while(true){
            if(tiles[end.x+":"+end.y].seen && tiles[end.x+":"+end.y].type == "door"){
                tiles[end.x+":"+end.y] = new tile(true, true, "floor");
            }else if(tiles[end.x+":"+end.y].type == "door" || tiles[end.x+":"+end.y].type == "wall"){
                tiles[end.x+":"+end.y].seen = true;
                break;
            }else{
                tiles[end.x+":"+end.y].seen = true;
            }
            end.y++;
        }
        var i = false;
        for(var x = start.x - 1; true; x--){
            if(i){break}
            for(var y = start.y; y <= end.y; y++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
        i = false;
        for(var x = start.x + 1; true; x++){
            if(i){break}
            for(var y = start.y; y <= end.y; y++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
    }else if(player.rotation == "left"){
        var start = new Vector2(player.position.x - 1, player.position.y);
        var end = new Vector2(player.position.x - 1, player.position.y);
        while(true){
            if(tiles[end.x+":"+end.y].seen && tiles[end.x+":"+end.y].type == "door"){
                tiles[end.x+":"+end.y] = new tile(true, true, "floor");
            }else if(tiles[end.x+":"+end.y].type == "door" || tiles[end.x+":"+end.y].type == "wall"){
                tiles[end.x+":"+end.y].seen = true;
                break;
            }else{
                tiles[end.x+":"+end.y].seen = true;
            }
            end.x--;
        }
        var i = false;
        for(var y = start.y - 1; true; y--){
            if(i){break}
            for(var x = start.x; x >= end.x; x--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
        i = false;
        for(var y = start.y + 1; true; y++){
            if(i){break}
            for(var x = start.x; x >= end.x; x--){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
    }else if(player.rotation == "right"){
        var start = new Vector2(player.position.x + 1, player.position.y);
        var end = new Vector2(player.position.x + 1, player.position.y);
        while(true){
            if(tiles[end.x+":"+end.y].seen && tiles[end.x+":"+end.y].type == "door"){
                tiles[end.x+":"+end.y] = new tile(true, true, "floor");
            }else if(tiles[end.x+":"+end.y].type == "door" || tiles[end.x+":"+end.y].type == "wall"){
                tiles[end.x+":"+end.y].seen = true;
                break;
            }else{
                tiles[end.x+":"+end.y].seen = true;
            }
            end.x++;
        }
        var i = false;
        for(var y = start.y - 1; true; y--){
            if(i){break}
            for(var x = start.x; x <= end.x; x++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
        i = false;
        for(var y = start.y + 1; true; y++){
            if(i){break}
            for(var x = start.x; x <= end.x; x++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].type == "door" && tiles[x+":"+y].seen){
                        tiles[x+":"+y] = new tile(true, true, "floor");
                    }else{
                        tiles[x+":"+y].seen = true;
                    }
                }else{i=true;break}
            }
        }
    }
    
}

// Renders minimap
function renderMinimap(){
    if(minimapEnabled){
        var mapSize = canvas.width - (xOffset + tileSize * ( 2 * renderDistance + 1));
        var pixelSize = Math.floor(mapSize / (layout.x * (2 * roomMargin + roomMaxSize.x)));
        context.fillStyle = "#000";
        context.fillRect(canvas.width - mapSize, canvas.height - mapSize, mapSize, mapSize);
        for(var x = 0; x < layout.x * (roomMaxSize.x + 2 * roomMargin); x++){
            for(var y = 0; y < layout.y * (roomMaxSize.y + 2 * roomMargin); y++){
                if(tiles[x+":"+y] != undefined){
                    if(tiles[x+":"+y].seen || seeAll){
                        if(tiles[x+":"+y].type == "door"){
                            context.fillStyle = "#7a5025";
                        }else if(tiles[x+":"+y].type =="wall"){
                            context.fillStyle = "#6b6b6b";
                        }else if(tiles[x+":"+y].type == "floor"){
                            context.fillStyle = "#ababab";
                        }
                        context.fillRect(canvas.width - mapSize + x * pixelSize, canvas.height - mapSize + y * pixelSize, pixelSize, pixelSize);
                    }
                }
            }
        }
        if(seePlayerOnMap){
            context.fillStyle = "#f00";
            context.fillRect(canvas.width - mapSize + player.position.x * pixelSize, canvas.height - mapSize + player.position.y * pixelSize, pixelSize, pixelSize);
        }
    }
}

// Render UI
function renderUI(){
    context.fillStyle = "#555";
    context.fillRect(0,0,xOffset,canvas.height);
    context.fillRect(xOffset + tileSize * ( 2 * renderDistance + 1), 0, canvas.width - (xOffset + tileSize * ( 2 * renderDistance + 1)), canvas.height);
}