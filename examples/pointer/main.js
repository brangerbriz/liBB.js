require.config({ baseUrl: "../../src" });
require(["BBModMouseInput", "BBModPointer"], 
function( BBModMouseInput,   BBModPointer) {

    var canvas = document.getElementById('canvas');
    var mouseInput = new BBModMouseInput(canvas);
    var pointer = new BBModPointer();

    pointer.on('start', mouseInput, function(){
        // fired when a pointer is pressed (if the input being used supports isDown)
    });

    pointer.on('stop', mouseInput, function(){
        // fired when a pointer is released (if the input being used supports isDown)
    });

    function update() {
        pointer.update(mouseInput);
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
        document.getElementById('mouse-x-pos').innerHTML = mouseInput.x;
        document.getElementById('mouse-y-pos').innerHTML = mouseInput.y;
        document.getElementById('mouse-prev-x-pos').innerHTML = mouseInput.prevX;
        document.getElementById('mouse-prev-y-pos').innerHTML = mouseInput.prevY;
        document.getElementById('mouse-click-x-pos').innerHTML = mouseInput.clickX;
        document.getElementById('mouse-click-y-pos').innerHTML = mouseInput.clickY;
        document.getElementById('mouse-prev-click-x-pos').innerHTML = mouseInput.prevClickX;
        document.getElementById('mouse-prev-click-y-pos').innerHTML = mouseInput.prevClickY;
        document.getElementById('mouse-is-moving').innerHTML = mouseInput.isMoving ? 'true' : 'false';
        document.getElementById('mouse-is-down').innerHTML = mouseInput.isDown ? 'true' : 'false';
    }

});