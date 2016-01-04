var canvas     = document.createElement('canvas');
    canvas.width    = window.innerWidth;
    canvas.height   = window.innerHeight;
    canvas.className = "absolute";
var ctx        = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.className = "radial-grey";

var box1        = new BB.Color();
var box2        = box1.clone();

function setup(){

    box2.createScheme("monochromatic");
    box2.createScheme("analogous");
    box2.createScheme("complementary");
    box2.createScheme("splitcomplementary");
    box2.createScheme("triadic");
    box2.createScheme("tetradic");
    box2.createScheme("random");
}

function setup2(){

    box2.createScheme("monochromatic");
    box2.createScheme("analogous",{
        tint: [0.2]
    });
    box2.createScheme("complementary",{
        tint: [ 0.4, 0.8 ],
        shade:[ 0.3, 0.6 ]
    });
    box2.createScheme("splitcomplementary");
    box2.createScheme("triadic",{
        tint: [0.4],
        shade:[0.3]
    });
    box2.createScheme("tetradic");
    box2.createScheme("random",{
        hue: box2.h
    });
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = box1.rgba;
    ctx.fillRect( 20, 20, 100, 485 ); 

    ctx.fillStyle = box2.rgba;
    ctx.fillRect( 130, 20, 265, 100 ); 

    var scheme, i, c = 0;
    for ( scheme in box2.schemes ) {
        for ( i = 0; i < box2.schemes[scheme].length; i++) {
            ctx.fillStyle = box2.schemes[scheme][i].rgb;
            ctx.fillRect( 130+(i*55),130+(c*55),  45, 45 );
        };      
        ctx.font = "20px Arial";
        ctx.textBaseline = 'top';
        ctx.fillText( scheme, 130+(i*55), 130+(c*55)  );
        c++;
    }
}

setup();
draw();






// ----------------------------------------------------
// ------------------------     -----------------------
// ------------------------ dat -----------------------
// ------------------------ gui -----------------------
// ------------------------     -----------------------
// ----------------------------------------------------
var dat_gui_lib = document.createElement('script');
dat_gui_lib.setAttribute('src','../../assets/js/dat.gui.bb.min.js');
document.body.appendChild(dat_gui_lib);
dat_gui_lib.onload = function(){

    var gui = new dat.GUI();  
    var curSet = 0;
    var methods = {
        shift: function(){  box2.shift( 10 );   },
        tint: function(){   box2.tint( 0.1 );   },
        shade: function(){  box2.shade( 0.9 );  },
        copy: function(){   box2.copy( box1 );  },
        s: function(){      setup(); curSet=0;  },
        s2: function(){     setup2(); curSet=1; }
    }
    function change(){
        if( curSet===0 ) setup();
        else             setup2();
        draw();
    }

    var f1 = gui.addFolder('hsv');
        f1.add(box2, 'h', 0, 359).step(1).name('hue').listen().onChange(function(){ change(); }); 
        f1.add(box2, 's', 0, 100).step(1).name('saturation').listen().onChange(function(){ change(); });
        f1.add(box2, 'v', 0, 100).step(1).name('value').listen().onChange(function(){ change(); });   

    var f2 = gui.addFolder('rgb');
        f2.add(box2, 'r', 0, 255).step(1).name('red').listen().onChange(function(){ change(); }); 
        f2.add(box2, 'g', 0, 255).step(1).name('green').listen().onChange(function(){ change(); });   
        f2.add(box2, 'b', 0, 255).step(1).name('blue').listen().onChange(function(){ change(); });

    var f3 = gui.addFolder('methods');
        f3.add(methods, 'shift').name(' .shift( 10 )');
        f3.add(methods, 'tint').name(' .tint( 0.1 )');
        f3.add(methods, 'shade').name(' .shade( 0.9 )');
        f3.add(methods, 'copy').name(' .copy( box1 )');


    var f4 = gui.addFolder('color schemes');
        f4.add(methods,'s').name('setup():<i>defaults</i>');
        f4.add(methods,'s2').name('setup2():<i>configs</i>');
}
