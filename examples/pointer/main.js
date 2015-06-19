require.config({ baseUrl: "../../src" });
require(["BBModMouseInput", "BBModPointer"], 
function( BBModMouseInput,   BBModPointer) {

    var canvas = document.getElementById('canvas');
    var mouseInput = new BBModMouseInput(canvas);
    var pointer = new BBModPointer(mouseInput);

    pointer.on('activestart', function(x, y){
        // fired when the pointer is pressed (if the input being used supports isDown)
        console.log('activestart');
    });

    pointer.on('activestop', function(x, y){
        // fired when the pointer is released (if the input being used supports isDown)
        console.log('activestop');
    });

    pointer.on('movestart', function(x, y){
        // fired when the pointer begins to move
        console.log('movestart');
    });

    pointer.on('movestop', function(x, y){
        // fired when the pointer stops moving
        console.log('movestop');
    });

    pointer.on('move', function(x, y){
        // fired every frame that the pointer is moving
        console.log('move');
    });

    function update() {
        mouseInput.update();
        pointer.update();
        updateDisplay();
    }

    function draw() {

    }

    setInterval(function(){
        update();
        draw();
    }, 1000/60);

    function updateDisplay() {
        
        // pointer
        document.getElementById('pointer-x-pos').innerHTML     = pointer.x;
        document.getElementById('pointer-y-pos').innerHTML     = pointer.y;
        document.getElementById('pointer-is-moving').innerHTML = pointer.isMoving ? 'true' : 'false';
        document.getElementById('pointer-is-down').innerHTML   = pointer.isDown ? 'true' : 'false';

        // mouse
        document.getElementById('mouse-click-x-pos').innerHTML = mouseInput.clickX;
        document.getElementById('mouse-click-y-pos').innerHTML = mouseInput.clickY;
    }

});