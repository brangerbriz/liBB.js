var currentBrush; // global for now just so that it can be accessed via the console for dev
var undo;

require.config({ baseUrl: "../../src" });
require(["BBModMouseInput", "BBModPointer", "BBModImageBrush2D", "BBModLineBrush2D", "BBModColor", "BBModBrushManager2D"], 
function( BBModMouseInput,   BBModPointer,   BBModImageBrush2D,   BBModLineBrush2D,   BBModColor,   BBModBrushManager2D) {

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var mouseInput, pointer, brushManager, imageBrush, lineBrush;

    function setup() {
        
        window.onresize = onWindowResize;
        onWindowResize();

        mouseInput = new BBModMouseInput(canvas);
        pointer = new BBModPointer(mouseInput);
        brushManager = new BBModBrushManager2D(canvas.width, canvas.height);
        brushManager.trackPointers([pointer]);

        imageBrush = new BBModImageBrush2D({
            src: "flower.png",
            color: new BBModColor(255, 0, 0),
            width: 50,
            height: 50,
            manager: brushManager
        });

        lineBrush = new BBModLineBrush2D({
            color: new BBModColor(0, 0, 255),
            weight: 20,
            variant: "solid",
            manager: brushManager
        });

        currentBrush = lineBrush;

        // explicitly call line brush selection to access the radio buttons
        onLineBrushSelection();
    }

    function update() {
        
        mouseInput.update();
        pointer.update();
        brushManager.update();

        currentBrush.update(pointer);
      
        if (currentBrush.type == "image") {
            currentBrush.rotation += 2;
        }

        updateDisplay();
    }

    function draw() {
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        currentBrush.draw(ctx);
        
        brushManager.draw(ctx);

    }

    setup();

    setInterval(function(){
        update();
        draw();
    }, 1000/60);

    function updateDisplay() {
        
        // base brush
        document.getElementById('base-brush-x').innerHTML          = currentBrush.x;
        document.getElementById('base-brush-y').innerHTML          = currentBrush.y;
        document.getElementById('base-brush-width').innerHTML      = currentBrush.width;
        document.getElementById('base-brush-height').innerHTML     = currentBrush.height;
        document.getElementById('base-brush-rotation').innerHTML   = currentBrush.rotation;
        document.getElementById('base-brush-color-r').innerHTML    = currentBrush.color.r;
        document.getElementById('base-brush-color-g').innerHTML    = currentBrush.color.g;
        document.getElementById('base-brush-color-b').innerHTML    = currentBrush.color.b;

        if (currentBrush.type == "image") {
            
            document.getElementById('brush-type').innerHTML = capitalize(currentBrush.type);
            var propertyBox = document.getElementById('secondary-brush-properties');
            propertyBox.innerHTML = "";
            
            // variant
            var span = document.createElement('span');
            span.id = "secondary-brush-property-variant-wrapper"
            span.innerHTML = "variant: ";
            propertyBox.appendChild(span);

            span = document.createElement('span');
            span.id = "secondary-brush-property-variant";
            span.innerHTML = currentBrush.variant;
            propertyBox.appendChild(span);
            propertyBox.appendChild(document.createElement('br'));

            // src
            var span = document.createElement('span');
            span.id = "secondary-brush-property-src-wrapper"
            span.innerHTML = "src: ";
            propertyBox.appendChild(span);

            var src = (typeof currentBrush.src === "string" &&
                       currentBrush.src.length > 30) ? currentBrush.src.substring(0, 28) + "..." : currentBrush.src;

            span = document.createElement('span');
            span.id = "secondary-brush-src";
            span.innerHTML = src;
            propertyBox.appendChild(span);

            document.getElementById('secondary-brush-box').style.display = "block";
        
        } else if (currentBrush.type == "line") {

            document.getElementById('brush-type').innerHTML = capitalize(currentBrush.type);
            var propertyBox = document.getElementById('secondary-brush-properties');
            propertyBox.innerHTML = "";
            
            // variant
            var span = document.createElement('span');
            span.id = "secondary-brush-property-variant-wrapper"
            span.innerHTML = "variant: ";
            propertyBox.appendChild(span);

            span = document.createElement('span');
            span.id = "secondary-brush-property-variant";
            span.innerHTML = currentBrush.variant;
            propertyBox.appendChild(span);
            propertyBox.appendChild(document.createElement('br'));

            // prevX, PrevY
            var span = document.createElement('span');
            span.id = "secondary-brush-property-prev-mouse-wrapper"
            span.innerHTML = "prevX, prevY: ";
            propertyBox.appendChild(span);

            span = document.createElement('span');
            span.id = "secondary-brush-property-prev-mouse";
            span.innerHTML = currentBrush.prevX + ", " + currentBrush.prevY;
            propertyBox.appendChild(span);
            propertyBox.appendChild(document.createElement('br'));

            // weight
            var span = document.createElement('span');
            span.id = "secondary-brush-property-weight-wrapper"
            span.innerHTML = "weight: ";
            propertyBox.appendChild(span);

            span = document.createElement('span');
            span.id = "secondary-brush-weight";
            span.innerHTML = currentBrush.weight;
            propertyBox.appendChild(span);

            document.getElementById('secondary-brush-box').style.display = "block";

        } else {
            document.getElementById('secondary-brush-box').style.display = "none";
        }

        function capitalize(input) {
            return input.replace(/^./, function (match) {
                return match.toUpperCase();
            });
        };
    }

    function onImageBrushSelection() {
            
        currentBrush = imageBrush;
        updateVariantList();

        var input = document.createElement('input');
        input.type = "text";
        input.name = "src";
        input.value = currentBrush.src;
        input.onchange = function(e) {
            currentBrush.src = this.value;
        }

        document.getElementById('variant-container').appendChild(input);

    }

    function onLineBrushSelection() {
        currentBrush = lineBrush;
        updateVariantList();
    }

    function onWindowResize() {
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        document.getElementById('brush-selection-image').onchange = onImageBrushSelection;
        document.getElementById('brush-selection-line').onchange = onLineBrushSelection;
        document.getElementById('undo-button').onclick = function() {
            if (brushManager.hasUndo()) {
                brushManager.undo();
            } else {
                alert('No more undos.');
            }
        }

        document.getElementById('redo-button').onclick = function() {
            if (brushManager.hasRedo()) {
                brushManager.redo();
            } else {
                alert('No more redos.');
            }
        }

    }

    function updateVariantList() {

        var form = document.getElementById('variant-container');
        form.innerHTML = "";

        for (var i = 0; i < currentBrush.variants.length; i++) {

            var variant = currentBrush.variants[i];
            var input = document.createElement('input');
            input.type = "radio"
            input.name = "variant"
            input.value = variant;

            if (i == 0) input.checked = "checked";

            function onInputChange(variant) {
                return function(e) {
                    currentBrush.variant = variant;
                }
            }

            input.onchange = onInputChange(variant);

            form.appendChild(input);

            var span = document.createElement('span');
            span.innerHTML = " " + variant;
            form.appendChild(span);
            form.appendChild(document.createElement('br'));
        }
    }

});
